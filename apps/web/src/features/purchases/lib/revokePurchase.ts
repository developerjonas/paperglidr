import "server-only"
import { eq } from "drizzle-orm"
import { db } from "@/drizzle/db"
import { PurchaseTable } from "@/drizzle/schema"
import { revokeUserCourseAccess } from "@/features/courses/db/userCourseAccess"
import { reverseLedgerEntriesForPurchase } from "@/features/ledger/db/ledger"

type Tx = Omit<typeof db, "$client">

/**
 * Refund bookkeeping for one purchase, inside the caller's transaction:
 * marks it refunded, removes course access the buyer doesn't still own
 * through another purchase, and writes the negative ledger mirror of every
 * sale so the creator's earnings net out. The money itself goes back by
 * hand in the gateway's merchant dashboard.
 *
 * The purchase row is locked first, so two concurrent calls serialize; a
 * purchase that is already refunded is left alone (no second reversal).
 * Used by the admin revokeAccess action and by refund approval.
 */
export async function revokePurchaseInTransaction(trx: Tx, purchaseId: string) {
  const [purchase] = await trx
    .select()
    .from(PurchaseTable)
    .where(eq(PurchaseTable.id, purchaseId))
    .for("update")
  if (purchase == null) return { outcome: "not_found" as const }
  if (purchase.status === "refunded") return { outcome: "already_refunded" as const, purchase }

  // Mark refunded first: revokeUserCourseAccess keeps access to any course
  // the buyer still owns through another non-refunded purchase, so this
  // purchase must no longer count as one.
  const now = new Date()
  await trx
    .update(PurchaseTable)
    .set({ status: "refunded", refundedAt: now, updatedAt: now })
    .where(eq(PurchaseTable.id, purchaseId))

  await revokeUserCourseAccess({ userId: purchase.userId, productId: purchase.productId }, trx)
  await reverseLedgerEntriesForPurchase(purchaseId, trx)

  return { outcome: "revoked" as const, purchase }
}
