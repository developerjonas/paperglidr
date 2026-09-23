"use server"
import { revalidatePath } from "next/cache"
import { DrizzleQueryError } from "drizzle-orm/errors"
import { getCurrentUser, requireAdmin } from "@/services/auth"
import { canRequestPayout } from "../permissions/payouts"
import {
  getInstructorAvailableBalance,
  markPayoutPaid,
  rejectPayout,
  requestPayout as requestPayoutDb,
} from "../db/payouts"
import { payoutRequestSchema } from "../schemas/payouts"

export async function requestPayout(unsafeData: { amountInRupees: number; bankDetailsSnapshot: string }) {
  const { userId } = await getCurrentUser()
  if (!canRequestPayout({ userId })) {
    return { error: true, message: "You must be signed in to request a payout" }
  }

  const { success, data } = payoutRequestSchema.safeParse(unsafeData)
  if (!success) return { error: true, message: "Invalid payout request" }

  try {
    await requestPayoutDb({
      instructorId: userId!,
      amountPaisa: Math.round(data.amountInRupees * 100),
      bankDetailsSnapshot: data.bankDetailsSnapshot,
    })
    revalidatePath("/teach/payouts")
    return { error: false, message: "Payout requested" }
  } catch (err) {
    // drizzle-orm >= 0.44 wraps DB failures in DrizzleQueryError, whose
    // message contains the SQL and its params (here: bank details) — log
    // it, never return it. Validation errors thrown by requestPayoutDb
    // (balance, minimum) are still shown as-is.
    if (err instanceof DrizzleQueryError) {
      console.error("requestPayout failed", err)
      return { error: true, message: "Failed to request payout" }
    }
    return { error: true, message: err instanceof Error ? err.message : "Failed to request payout" }
  }
}

export async function approvePayout(payoutId: string) {
  await requireAdmin()
  await markPayoutPaid(payoutId)
  revalidatePath("/admin/payouts")
  return { error: false, message: "Payout marked as paid" }
}

export async function denyPayout(payoutId: string, reason: string) {
  await requireAdmin()
  await rejectPayout(payoutId, reason)
  revalidatePath("/admin/payouts")
  return { error: false, message: "Payout rejected" }
}

export async function getMyAvailableBalanceInRupees() {
  const { userId } = await getCurrentUser()
  if (userId == null) return 0
  return (await getInstructorAvailableBalance(userId)) / 100
}
