import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/drizzle/db";
import { RefundRequestCourseTable, RefundRequestTable } from "@/drizzle/schema/refundRequest";

// A purchase can have at most one open request: pending, approved or
// processed (enforced by refund_requests_open_purchase_idx). A denied
// request doesn't block a new one.
export const OPEN_REFUND_STATUSES = ["pending", "approved", "processed"] as const;

export async function getOpenRefundRequest(purchaseId: string) {
  return db.query.RefundRequestTable.findFirst({
    where: and(
      eq(RefundRequestTable.purchaseId, purchaseId),
      inArray(RefundRequestTable.status, [...OPEN_REFUND_STATUSES]),
    ),
  });
}

export async function getLatestRefundRequest(purchaseId: string) {
  return db.query.RefundRequestTable.findFirst({
    where: eq(RefundRequestTable.purchaseId, purchaseId),
    orderBy: desc(RefundRequestTable.createdAt),
  });
}

/**
 * The request and all of its courses, in one transaction. Returns null
 * (nothing written) if the purchase already has an open request.
 */
export async function insertRefundRequest(
  data: Omit<typeof RefundRequestTable.$inferInsert, "courseId">,
  courseIds: string[],
) {
  if (courseIds.length === 0) throw new Error("A refund request needs at least one course");
  return db.transaction(async (trx) => {
    const [refundRequest] = await trx
      .insert(RefundRequestTable)
      .values({ ...data, courseId: courseIds[0]! })
      .onConflictDoNothing()
      .returning();
    if (refundRequest == null) return null;
    await trx
      .insert(RefundRequestCourseTable)
      .values(courseIds.map((courseId) => ({ refundRequestId: refundRequest.id, courseId })));
    return refundRequest;
  });
}

// Admin review queue: pending first (oldest first), then the most recent
// decisions. Add pagination once volume warrants it.
export async function getRefundRequestsForAdmin() {
  const withDetails = {
    user: { columns: { name: true, email: true } },
    reviewer: { columns: { name: true, email: true } },
    processor: { columns: { name: true, email: true } },
    courses: { columns: {}, with: { course: { columns: { id: true, name: true } } } },
    purchase: {
      columns: {
        id: true,
        productDetails: true,
        pricePaidInPaisa: true,
        gateway: true,
        gatewayTransactionId: true,
        gatewayCheckoutId: true,
        status: true,
        createdAt: true,
        refundedAt: true,
      },
    },
  } as const;
  const [pending, decided] = await Promise.all([
    db.query.RefundRequestTable.findMany({
      where: eq(RefundRequestTable.status, "pending"),
      orderBy: (r, { asc }) => asc(r.createdAt),
      with: withDetails,
    }),
    db.query.RefundRequestTable.findMany({
      where: inArray(RefundRequestTable.status, ["approved", "denied", "processed"]),
      orderBy: (r, { desc }) => desc(r.reviewedAt),
      limit: 50,
      with: withDetails,
    }),
  ]);
  return { pending, decided };
}
