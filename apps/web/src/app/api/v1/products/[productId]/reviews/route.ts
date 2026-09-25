import { apiError, isUuid, apiJson, v1Route } from "@/lib/api/v1"
import { getPublicProductDetail } from "@/features/products/db/products"
import { getProductReviews } from "@/features/reviews/db/reviews"

// Public. GET /api/v1/products/[id]/reviews?page= — 20 per page, newest first.
export const GET = v1Route<{ productId: string }>("product reviews", async (req, { params }) => {
  const { productId } = await params
  if (!isUuid(productId)) return apiError(404, "Product not found")
  if ((await getPublicProductDetail(productId)) == null) {
    return apiError(404, "Product not found")
  }
  const page = Number(new URL(req.url).searchParams.get("page") ?? "1")
  if (!Number.isInteger(page) || page < 1) return apiError(400, "page must be a positive integer")
  return apiJson(await getProductReviews(productId, page))
})
