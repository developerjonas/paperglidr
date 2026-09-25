import { and, desc, eq } from "drizzle-orm"
import { apiError, isUuid, apiJson, requireApiUser, v1Route } from "@/lib/api/v1"
import { db } from "@/drizzle/db"
import { PurchaseTable } from "@/drizzle/schema"
import { getPublicProductDetail } from "@/features/products/db/products"
import { alreadyOwnsProduct } from "@/features/purchases/lib/ownership"
import { isProductWishlisted } from "@/features/wishlist/db/wishlist"

/**
 * The signed-in viewer's relation to a product: whether they own it (show
 * "Go to course" instead of "Buy"), have it wishlisted, and their latest
 * purchase of it, if any.
 */
export const GET = v1Route<{ productId: string }>("product viewer state", async (_req, { params }) => {
  const gate = await requireApiUser()
  if (!gate.ok) return gate.response
  const { userId } = gate.user

  const { productId } = await params
  if (!isUuid(productId)) return apiError(404, "Product not found")
  if ((await getPublicProductDetail(productId)) == null) {
    return apiError(404, "Product not found")
  }

  const [owned, wishlisted, latestPurchase] = await Promise.all([
    alreadyOwnsProduct({ userId, productId }),
    isProductWishlisted(userId, productId),
    db.query.PurchaseTable.findFirst({
      where: and(eq(PurchaseTable.userId, userId), eq(PurchaseTable.productId, productId)),
      orderBy: desc(PurchaseTable.createdAt),
      columns: { id: true, status: true, createdAt: true },
    }),
  ])

  return apiJson({ owned, wishlisted, latestPurchase: latestPurchase ?? null })
})
