import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/drizzle/db";
import { RefundRequestTable } from "@/drizzle/schema/refundRequest";

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

export async function insertRefundRequest(
  data: typeof RefundRequestTable.$inferInsert,
) {
  const [refundRequest] = await db
    .insert(RefundRequestTable)
    .values(data)
    .onConflictDoNothing()
    .returning();
  return refundRequest ?? null;
}

// Admin review queue: pending first (oldest first), then the most recent
// decisions. Add pagination once volume warrants it.
export async function getRefundRequestsForAdmin() {
  const withDetails = {
    user: { columns: { name: true, email: true } },
    reviewer: { columns: { name: true, email: true } },
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
