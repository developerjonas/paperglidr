"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { db } from "@/drizzle/db";
import { PurchaseTable } from "@/drizzle/schema/purchase";
import { getRefundEligibility } from "../lib/eligibility";
import { getOpenRefundRequest, insertRefundRequest } from "../db/refunds";
import { approveRefundRequest, rejectRefundRequest } from "../lib/reviewRefund";
import { getCurrentUser, requireAdmin } from "@/services/auth";
import { POLICY_TERMS } from "@/config/policyTerms";
import { UserFacingError, actionError } from "@/lib/safeError";

async function getOwnedPurchase(purchaseId: string) {
  const { userId } = await getCurrentUser();
  if (userId == null) throw new UserFacingError("Sign in to request a refund.");
  if (!z.string().uuid().safeParse(purchaseId).success) {
    throw new UserFacingError("Purchase not found");
  }
  const purchase = await db.query.PurchaseTable.findFirst({
    where: and(eq(PurchaseTable.id, purchaseId), eq(PurchaseTable.userId, userId)),
  });
  if (purchase == null) throw new UserFacingError("Purchase not found");
  return { purchase, userId };
}

export async function checkMyRefundEligibility(purchaseId: string) {
  try {
    await getOwnedPurchase(purchaseId);
    const [eligibility, openRequest] = await Promise.all([
      getRefundEligibility(purchaseId),
      getOpenRefundRequest(purchaseId),
    ]);
    return {
      error: false as const,
      eligibility: {
        eligible: eligibility.eligible && openRequest == null,
        msRemaining: eligibility.msRemaining,
        completionPercent: eligibility.completionPercent,
      },
      openRequestStatus: openRequest?.status ?? null,
    };
  } catch (error) {
    return actionError(error, "checkMyRefundEligibility");
  }
}

const reasonSchema = z.string().trim().max(2000).optional();

export async function requestRefund(purchaseId: string, reason?: string) {
  try {
    const { purchase, userId } = await getOwnedPurchase(purchaseId);
    const parsedReason = reasonSchema.safeParse(reason);
    if (!parsedReason.success) throw new UserFacingError("That reason is too long.");

    // Recomputed server-side, at request time — never trusted from the client.
    const eligibility = await getRefundEligibility(purchase.id);
    if (!eligibility.eligible) {
      throw new UserFacingError(
        eligibility.reason === "window_closed"
          ? `This purchase is outside the ${POLICY_TERMS.refundWindowDays}-day refund window.`
          : eligibility.reason === "completion_too_high"
            ? `You've completed ${POLICY_TERMS.refundCompletionThresholdPercent}% or more of this course, so it no longer qualifies for a refund.`
            : "This purchase can't be refunded.",
      );
    }

    const refundRequest = await insertRefundRequest({
      purchaseId: purchase.id,
      userId,
      courseId: eligibility.courseIds[0]!,
      reason: parsedReason.data || null,
      completionPercentAtRequest: Math.round(eligibility.completionPercent),
      withinWindowAtRequest: eligibility.withinWindow,
      eligible: true,
      status: "pending",
    });
    // The unique index allows one open request per purchase.
    if (refundRequest == null) {
      throw new UserFacingError("You've already requested a refund for this purchase.");
    }

    revalidatePath("/admin/refunds");
    revalidatePath(`/purchases/${purchase.id}`);
    return { error: false as const, message: "Refund request submitted." };
  } catch (error) {
    return actionError(error, "requestRefund");
  }
}

export async function approveRefund(requestId: string) {
  const { userId: adminId } = await requireAdmin();
  try {
    if (!z.string().uuid().safeParse(requestId).success) {
      throw new UserFacingError("Refund request not found");
    }
    const result = await approveRefundRequest({ requestId, adminId });
    if (result.outcome === "not_found") throw new UserFacingError("Refund request not found");
    if (result.outcome === "already_reviewed") {
      throw new UserFacingError("This request has already been reviewed");
    }
    revalidatePath("/admin/refunds");
    return {
      error: false as const,
      message: "Approved: access revoked and ledger reversed. Now return the money in the gateway dashboard.",
    };
  } catch (error) {
    return actionError(error, "approveRefund");
  }
}

export async function rejectRefund(requestId: string, reason: string) {
  const { userId: adminId } = await requireAdmin();
  try {
    const parsed = z
      .object({ requestId: z.string().uuid(), reason: z.string().trim().min(1).max(2000) })
      .safeParse({ requestId, reason });
    if (!parsed.success) throw new UserFacingError("A reason is required");
    const result = await rejectRefundRequest({ adminId, ...parsed.data });
    if (result.outcome === "already_reviewed") {
      throw new UserFacingError("This request has already been reviewed");
    }
    revalidatePath("/admin/refunds");
    return { error: false as const, message: "Refund request rejected" };
  } catch (error) {
    return actionError(error, "rejectRefund");
  }
}
