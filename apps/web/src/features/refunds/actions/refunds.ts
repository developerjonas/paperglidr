"use server";

import { db } from "@/drizzle/db";
import { PurchaseTable } from "@/drizzle/schema/purchase";
import { eq } from "drizzle-orm";
import { getRefundEligibility } from "../lib/eligibility";
import { createRefundRequest } from "../db/refunds";
import { getCurrentUser } from "@/services/auth";

async function getOwnedPurchase(purchaseId: string, userId: string) {
  const purchase = await db.query.PurchaseTable.findFirst({
    where: eq(PurchaseTable.id, purchaseId),
  });
  if (purchase == null || purchase.userId !== userId) return null;
  return purchase;
}

export async function checkMyRefundEligibility(purchaseId: string) {
  const session = await getCurrentUser();
  if (session?.user?.id == null) return { error: "Not signed in" };

  const purchase = await getOwnedPurchase(purchaseId, session.user.id);
  if (purchase == null) return { error: "Purchase not found" };

  return { eligibility: await getRefundEligibility(purchaseId) };
}

export async function requestRefund(purchaseId: string, reason?: string) {
  const session = await getCurrentUser();
  if (session?.user?.id == null) return { error: "Not signed in" };

  const purchase = await getOwnedPurchase(purchaseId, session.user.id);
  if (purchase == null) return { error: "Purchase not found" };

  // ADJUST: this assumes `purchase.productId` resolves 1:1 to a course.
  // If a product can bundle multiple courses, resolve the right courseId
  // (or aggregate eligibility across the bundle) before calling this.
  const { refundRequest, eligibility } = await createRefundRequest({
    purchaseId,
    userId: session.user.id,
    courseId: purchase.productId,
    reason,
  });

  if (!eligibility.eligible) {
    return {
      error:
        eligibility.reason === "window_closed"
          ? "This purchase is outside the 7-day refund window."
          : "You've completed too much of this course to qualify for a refund.",
      refundRequest,
    };
  }

  return { success: true, refundRequest };
}
