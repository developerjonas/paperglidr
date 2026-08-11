import { db } from "@/drizzle/db";
import { RefundRequestTable } from "@/drizzle/schema/refundRequest";
import { getRefundEligibility } from "../lib/eligibility";

export async function createRefundRequest({
  purchaseId,
  userId,
  courseId,
  reason,
}: {
  purchaseId: string;
  userId: string;
  courseId: string;
  reason?: string;
}) {
  // Recompute eligibility here, server-side, at request time. Never trust
  // an eligibility value passed in from the client.
  const eligibility = await getRefundEligibility(purchaseId);

  const [refundRequest] = await db
    .insert(RefundRequestTable)
    .values({
      purchaseId,
      userId,
      courseId,
      reason,
      completionPercentAtRequest: Math.round(eligibility.completionPercent),
      withinWindowAtRequest: eligibility.withinWindow,
      eligible: eligibility.eligible,
      status: "pending",
    })
    .returning();

  return { refundRequest, eligibility };
}

// Admin review queue. Add pagination once volume warrants it.
export async function getRefundRequestsForAdmin() {
  return db.query.RefundRequestTable.findMany({
    orderBy: (r, { desc }) => desc(r.createdAt),
    with: { course: true, user: true, purchase: true },
  });
}
