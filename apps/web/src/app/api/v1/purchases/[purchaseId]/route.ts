import { and, eq } from "drizzle-orm"
import { apiError, apiJson, isUuid, requireApiUser, v1Route } from "@/lib/api/v1"
import { db } from "@/drizzle/db"
import { PurchaseTable } from "@/drizzle/schema"
import { getLatestRefundRequest } from "@/features/refunds/db/refunds"

/**
 * One of the user's purchases, with its latest refund request (if any).
 * Refund eligibility: GET /api/v1/purchases/[id]/refund.
 */
export const GET = v1Route<{ purchaseId: string }>("purchase", async (_req, { params }) => {
  const gate = await requireApiUser()
  if (!gate.ok) return gate.response
  const { purchaseId } = await params
  if (!isUuid(purchaseId)) return apiError(404, "Purchase not found")

  const purchase = await db.query.PurchaseTable.findFirst({
    where: and(eq(PurchaseTable.id, purchaseId), eq(PurchaseTable.userId, gate.user.userId)),
  })
  if (purchase == null) return apiError(404, "Purchase not found")

  const refund = await getLatestRefundRequest(purchase.id)
  return apiJson({
    id: purchase.id,
    status: purchase.status,
    gateway: purchase.gateway,
    productId: purchase.productId,
    product: purchase.productDetails,
    pricePaidInPaisa: purchase.pricePaidInPaisa,
    discountAmountPaisa: purchase.discountAmountPaisa,
    createdAt: purchase.createdAt,
    refundedAt: purchase.refundedAt,
    refundRequest:
      refund == null
        ? null
        : { status: refund.status, reason: refund.reason, createdAt: refund.createdAt, reviewedAt: refund.reviewedAt },
  })
})
