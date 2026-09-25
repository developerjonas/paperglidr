// apps/web/src/app/api/v1/products/[productId]/route.ts
import { apiError, isUuid, apiJson, v1Route } from "@/lib/api/v1"
import { getPublicProductDetail } from "@/features/products/db/products"
import { getProductReviews } from "@/features/reviews/db/reviews"

/**
 * Public. The product page: details, instructor, included courses and the
 * rating summary. Each course's outline: GET /api/v1/courses/[courseId].
 * Whether the viewer owns or saved it: GET /api/v1/products/[id]/me.
 */
export const GET = v1Route<{ productId: string }>("product", async (_req, { params }) => {
  const { productId } = await params
  if (!isUuid(productId)) return apiError(404, "Product not found")
  const product = await getPublicProductDetail(productId)
  if (!product) return apiError(404, "Product not found")

  const { averageRating, reviewCount } = await getProductReviews(productId)
  return apiJson({ ...product, averageRating, reviewCount })
})
