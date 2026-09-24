import { db } from "@/drizzle/db"
import {
  InstructorTable,
  LedgerEntryTable,
  PayoutTable,
  PurchaseTable,
  type PayoutDetails,
} from "@/drizzle/schema"
import { and, eq, inArray, sql } from "drizzle-orm"
import { REFUND_WINDOW_MS } from "@/features/refunds/lib/refundTerms"
import { UserFacingError } from "@/lib/safeError"

type Tx = Omit<typeof db, "$client">

// NPR 1,000 per the roadmap — confirmed
export const MINIMUM_PAYOUT_PAISA = 100_000

// Earnings from a sale become withdrawable once the sale's refund window
// has closed, so creators can't withdraw money that is later refunded.
export const PAYOUT_HOLD_MS = REFUND_WINDOW_MS

// A payout needs a phone number verified by OTP (fraud / identity check).
export const PAYOUT_REQUIRES_VERIFIED_PHONE = true

/**
 * Balances in paisa:
 * - held: the creator's share of sales still inside the refund window
 *   (by the purchase's order time, the same clock the refund rule uses)
 * - available: everything else they've earned (refund reversals included),
 *   minus payouts paid, minus payout requests still pending
 * A refund of a held sale cancels out inside "held"; a later refund of an
 * older sale comes off "available".
 */
export async function getInstructorBalances(instructorId: string, trx: Tx = db) {
  const cutoff = new Date(Date.now() - PAYOUT_HOLD_MS)
  const [earned] = await trx
    .select({
      settled: sql<number>`coalesce(sum(${LedgerEntryTable.creatorEarningsPaisa}) filter (where ${PurchaseTable.createdAt} <= ${cutoff}), 0)::bigint`,
      held: sql<number>`coalesce(sum(${LedgerEntryTable.creatorEarningsPaisa}) filter (where ${PurchaseTable.createdAt} > ${cutoff}), 0)::bigint`,
    })
    .from(LedgerEntryTable)
    .innerJoin(PurchaseTable, eq(PurchaseTable.id, LedgerEntryTable.purchaseId))
    .where(eq(LedgerEntryTable.instructorId, instructorId))

  const [committed] = await trx
    .select({ total: sql<number>`coalesce(sum(${PayoutTable.amountPaisa}), 0)::bigint` })
    .from(PayoutTable)
    .where(
      and(
        eq(PayoutTable.instructorId, instructorId),
        inArray(PayoutTable.status, ["paid", "requested"]),
      ),
    )

  const settled = Number(earned?.settled ?? 0)
  return {
    available: settled - Number(committed?.total ?? 0),
    held: Math.max(Number(earned?.held ?? 0), 0),
  }
}

export async function getInstructorAvailableBalance(instructorId: string) {
  return (await getInstructorBalances(instructorId)).available
}

/**
 * The balance check and the insert run in one transaction with the
 * creator's instructor row locked (SELECT … FOR UPDATE), so two requests
 * at the same moment serialize: the second sees the first as pending and
 * can't spend the same balance. The instructor row is also where the
 * verified phone lives, so the lock covers that check too.
 */
export async function requestPayout({
  instructorId,
  amountPaisa,
  details,
  bankDetailsSnapshot,
}: {
  instructorId: string
  amountPaisa: number
  details: PayoutDetails
  bankDetailsSnapshot: string
}) {
  return db.transaction(async trx => {
    const [instructor] = await trx
      .select({ id: InstructorTable.id, phoneVerifiedAt: InstructorTable.phoneVerifiedAt })
      .from(InstructorTable)
      .where(eq(InstructorTable.userId, instructorId))
      .for("update")
    if (instructor == null) {
      throw new UserFacingError("Create your instructor profile before requesting a payout.")
    }
    if (PAYOUT_REQUIRES_VERIFIED_PHONE && instructor.phoneVerifiedAt == null) {
      throw new UserFacingError("Verify your phone number before requesting a payout.")
    }
    if (amountPaisa < MINIMUM_PAYOUT_PAISA) {
      throw new UserFacingError(`Minimum payout is NPR ${(MINIMUM_PAYOUT_PAISA / 100).toLocaleString("en-IN")}.`)
    }
    const { available } = await getInstructorBalances(instructorId, trx)
    if (amountPaisa > available) {
      throw new UserFacingError("That's more than your available balance.")
    }

    const [payout] = await trx
      .insert(PayoutTable)
      .values({
        instructorId,
        amountPaisa,
        bankDetailsSnapshot,
        payoutMethod: details.method,
        payoutDetails: details,
        status: "requested",
      })
      .returning()
    return payout!
  })
}

// Status-guarded WHERE clause — same pattern as markPurchaseCompleted, so a
// double-click or double-submit on the admin approve button can't process
// the same payout twice.
export async function markPayoutPaid(payoutId: string) {
  const [payout] = await db
    .update(PayoutTable)
    .set({ status: "paid", paidAt: new Date() })
    .where(and(eq(PayoutTable.id, payoutId), eq(PayoutTable.status, "requested")))
    .returning()
  if (payout == null) throw new Error("Payout not found or already processed")
  return payout
}

export async function rejectPayout(payoutId: string, reason: string) {
  const [payout] = await db
    .update(PayoutTable)
    .set({ status: "rejected", rejectedReason: reason })
    .where(and(eq(PayoutTable.id, payoutId), eq(PayoutTable.status, "requested")))
    .returning()
  if (payout == null) throw new Error("Payout not found or already processed")
  return payout
}

/**
 * Powers the admin payouts queue — pending requests only, oldest first so
 * the admin works through them in the order they came in.
 */
export async function getPendingPayouts() {
  return db.query.PayoutTable.findMany({
    where: eq(PayoutTable.status, "requested"),
    orderBy: (payouts, { asc }) => [asc(payouts.createdAt)],
    with: { instructor: true },
  })
}

/**
 * Powers the instructor's own payout history on /teach/payouts — all of
 * their requests regardless of status, newest first so they see their
 * latest request at the top.
 */
export async function getInstructorPayoutHistory(instructorId: string) {
  return db.query.PayoutTable.findMany({
    where: eq(PayoutTable.instructorId, instructorId),
    orderBy: (payouts, { desc }) => [desc(payouts.createdAt)],
  })
}
