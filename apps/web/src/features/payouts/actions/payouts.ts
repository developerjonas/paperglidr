"use server"
import { revalidatePath } from "next/cache"
import { getCurrentUser, requireAdmin } from "@/services/auth"
import { canRequestPayout } from "../permissions/payouts"
import {
  getInstructorBalances,
  markPayoutPaid,
  rejectPayout,
  requestPayout as requestPayoutDb,
} from "../db/payouts"
import {
  formatPayoutDetails,
  payoutRequestSchema,
  type PayoutRequestInput,
} from "../schemas/payouts"
import { UserFacingError, actionError } from "@/lib/safeError"

export async function requestPayout(unsafeData: PayoutRequestInput) {
  try {
    const { userId } = await getCurrentUser()
    if (!canRequestPayout({ userId })) {
      throw new UserFacingError("You must be signed in to request a payout")
    }

    const parsed = payoutRequestSchema.safeParse(unsafeData)
    if (!parsed.success) {
      throw new UserFacingError(parsed.error.issues[0]?.message ?? "Invalid payout request")
    }
    const { amountInRupees, details } = parsed.data

    // Balance, minimum, verified phone and the insert are checked in one
    // locked transaction; their messages are UserFacingError. Anything
    // else (e.g. a DrizzleQueryError, whose message contains the SQL and
    // the bank details) is logged and replaced by a generic message.
    await requestPayoutDb({
      instructorId: userId!,
      amountPaisa: Math.round(amountInRupees * 100),
      details,
      bankDetailsSnapshot: formatPayoutDetails(details),
    })
    revalidatePath("/teach/payouts")
    revalidatePath("/admin/payouts")
    return { error: false, message: "Payout requested" }
  } catch (error) {
    return actionError(error, "requestPayout", "Failed to request payout")
  }
}

export async function approvePayout(payoutId: string) {
  await requireAdmin()
  try {
    await markPayoutPaid(payoutId)
  } catch (error) {
    return actionError(error, "approvePayout", "Payout not found or already processed")
  }
  revalidatePath("/admin/payouts")
  return { error: false, message: "Payout marked as paid" }
}

export async function denyPayout(payoutId: string, reason: string) {
  await requireAdmin()
  try {
    await rejectPayout(payoutId, reason)
  } catch (error) {
    return actionError(error, "denyPayout", "Payout not found or already processed")
  }
  revalidatePath("/admin/payouts")
  return { error: false, message: "Payout rejected" }
}

export async function getMyBalancesInRupees() {
  const { userId } = await getCurrentUser()
  if (userId == null) return { available: 0, held: 0 }
  const { available, held } = await getInstructorBalances(userId)
  return { available: available / 100, held: held / 100 }
}
