import { db } from "@/drizzle/db"
import { PayoutTable } from "@/drizzle/schema"
import { and, eq } from "drizzle-orm"
import { getInstructorTotalEarnings } from "@/features/ledger/db/ledger"

// NPR 1,000 per the roadmap — CONFIRM this figure
const MINIMUM_PAYOUT_PAISA = 100_000

async function getInstructorPaidOutTotal(instructorId: string) {
  const paid = await db.query.PayoutTable.findMany({
    where: and(eq(PayoutTable.instructorId, instructorId), eq(PayoutTable.status, "paid")),
    columns: { amountPaisa: true },
  })
  return paid.reduce((total, p) => total + p.amountPaisa, 0)
}

async function getInstructorPendingRequestTotal(instructorId: string) {
  const pending = await db.query.PayoutTable.findMany({
    where: and(eq(PayoutTable.instructorId, instructorId), eq(PayoutTable.status, "requested")),
    columns: { amountPaisa: true },
  })
  return pending.reduce((total, p) => total + p.amountPaisa, 0)
}

/**
 * Lifetime earnings minus what's already been paid out minus what's already
 * requested (and not yet decided) — this is what stops an instructor from
 * requesting the same balance twice while a first request is pending review.
 */
export async function getInstructorAvailableBalance(instructorId: string) {
  const [totalEarnings, paidOut, pendingRequests] = await Promise.all([
    getInstructorTotalEarnings(instructorId),
    getInstructorPaidOutTotal(instructorId),
    getInstructorPendingRequestTotal(instructorId),
  ])
  return totalEarnings - paidOut - pendingRequests
}

export async function requestPayout({
  instructorId,
  amountPaisa,
  bankDetailsSnapshot,
}: {
  instructorId: string
  amountPaisa: number
  bankDetailsSnapshot: string
}) {
  const availableBalance = await getInstructorAvailableBalance(instructorId)
  if (amountPaisa > availableBalance) throw new Error("Requested amount exceeds available balance")
  if (amountPaisa < MINIMUM_PAYOUT_PAISA) {
    throw new Error(`Minimum payout is NPR ${MINIMUM_PAYOUT_PAISA / 100}`)
  }

  const [payout] = await db
    .insert(PayoutTable)
    .values({ instructorId, amountPaisa, bankDetailsSnapshot, status: "requested" })
    .returning()
  return payout
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
