"use server"
import { canRefundPurchases } from "../permissions/products"
import { getCurrentUser } from "@/services/clerk"
import { db } from "@/drizzle/db"
import { updatePurchase } from "../db/purchases"
import { revokeUserCourseAccess } from "@/features/courses/db/userCourseAcccess"

// Renamed from refundPurchase — there's no payment to refund anymore,
// this just removes the user's access to the course.
export async function revokeAccess(id: string) {
  if (!canRefundPurchases(await getCurrentUser())) {
    return {
      error: true,
      message: "There was an error revoking access to this course",
    }
  }

  const data = await db.transaction(async trx => {
    // Still reusing the "refundedAt" column/field name to mark the
    // purchase as void, so nothing else that reads it needs to change.
    // Worth renaming to something like "revokedAt" in a later cleanup pass.
    const revokedPurchase = await updatePurchase(
      id,
      { refundedAt: new Date() },
      trx
    )

    try {
      await revokeUserCourseAccess(revokedPurchase, trx)
    } catch {
      trx.rollback()
      return {
        error: true,
        message: "There was an error revoking access to this course",
      }
    }
  })

  return data ?? { error: false, message: "Successfully revoked access" }
}
