import "server-only"
import { and, eq } from "drizzle-orm"
import { db } from "@/drizzle/db"
import { RefundRequestTable, UserTable } from "@/drizzle/schema"
import { revokePurchaseInTransaction } from "@/features/purchases/lib/revokePurchase"
import { revalidateProductCache } from "@/features/products/db/cache"
import { sendNotification } from "@/services/email/notifications"
import { env as clientEnv } from "@/data/env/client"

const GATEWAY_LABELS: Record<string, string> = {
  esewa: "eSewa",
  khalti: "Khalti",
  fonepay: "Fonepay",
}
const npr = (paisa: number) => `NPR ${(paisa / 100).toLocaleString("en-IN")}`

/**
 * Approve: in ONE transaction, lock the request (it must still be pending),
 * run the same revoke as the admin revokeAccess action (purchase refunded,
 * access removed, ledger reversed — at most once), and record who approved
 * and when. The buyer is emailed after the commit.
 */
export async function approveRefundRequest({
  requestId,
  adminId,
}: {
  requestId: string
  adminId: string
}) {
  const result = await db.transaction(async trx => {
    const [request] = await trx
      .select()
      .from(RefundRequestTable)
      .where(eq(RefundRequestTable.id, requestId))
      .for("update")
    if (request == null) return { outcome: "not_found" as const }
    if (request.status !== "pending") return { outcome: "already_reviewed" as const }

    const revoked = await revokePurchaseInTransaction(trx, request.purchaseId)
    if (revoked.outcome === "not_found") return { outcome: "not_found" as const }

    const now = new Date()
    await trx
      .update(RefundRequestTable)
      .set({ status: "approved", reviewedBy: adminId, reviewedAt: now, updatedAt: now })
      .where(eq(RefundRequestTable.id, requestId))

    return { outcome: "approved" as const, request, purchase: revoked.purchase }
  })

  if (result.outcome !== "approved") return result

  revalidateProductCache(result.purchase.productId)
  const buyer = await db.query.UserTable.findFirst({
    where: eq(UserTable.id, result.request.userId),
    columns: { name: true, email: true },
  })
  if (buyer != null) {
    const gateway = GATEWAY_LABELS[result.purchase.gateway] ?? result.purchase.gateway
    await sendNotification({
      to: buyer.email,
      subject: `Your refund for "${result.purchase.productDetails.name}" was approved`,
      paragraphs: [
        `Hi ${buyer.name},`,
        `Your refund request for "${result.purchase.productDetails.name}" has been approved, and your access to the course has ended.`,
        `We will return ${npr(result.purchase.pricePaidInPaisa)} to the ${gateway} account you paid with. Refunds are processed by hand, so it can take a few working days to arrive.`,
        `Purchase reference: ${result.purchase.id}`,
      ],
    })
  }
  return result
}

/** Reject a pending request with a reason, which is emailed to the buyer. */
export async function rejectRefundRequest({
  requestId,
  adminId,
  reason,
}: {
  requestId: string
  adminId: string
  reason: string
}) {
  const now = new Date()
  const [request] = await db
    .update(RefundRequestTable)
    .set({ status: "denied", adminNote: reason, reviewedBy: adminId, reviewedAt: now, updatedAt: now })
    .where(and(eq(RefundRequestTable.id, requestId), eq(RefundRequestTable.status, "pending")))
    .returning()
  if (request == null) return { outcome: "already_reviewed" as const }

  const [buyer, purchase] = await Promise.all([
    db.query.UserTable.findFirst({
      where: eq(UserTable.id, request.userId),
      columns: { name: true, email: true },
    }),
    db.query.PurchaseTable.findFirst({
      where: (p, { eq }) => eq(p.id, request.purchaseId),
      columns: { productDetails: true },
    }),
  ])
  if (buyer != null) {
    const name = purchase?.productDetails.name ?? "your course"
    await sendNotification({
      to: buyer.email,
      subject: `Your refund request for "${name}"`,
      paragraphs: [
        `Hi ${buyer.name},`,
        `We couldn't approve your refund request for "${name}". The reason given was:`,
        reason,
        "You still have access to the course. If you think this is a mistake, reply to our support team from the link below.",
      ],
      link: { href: `${clientEnv.NEXT_PUBLIC_APP_URL}/support/new`, label: "Contact support" },
    })
  }
  return { outcome: "rejected" as const }
}

/**
 * After the money has been returned by hand in the gateway dashboard:
 * approved -> processed, recording who and when. Status-guarded, so it
 * happens once and only after approval.
 */
export async function markRefundProcessed({ requestId, adminId }: { requestId: string; adminId: string }) {
  const now = new Date()
  const [request] = await db
    .update(RefundRequestTable)
    .set({ status: "processed", processedBy: adminId, processedAt: now, updatedAt: now })
    .where(and(eq(RefundRequestTable.id, requestId), eq(RefundRequestTable.status, "approved")))
    .returning()
  return request == null ? { outcome: "not_approved" as const } : { outcome: "processed" as const }
}
