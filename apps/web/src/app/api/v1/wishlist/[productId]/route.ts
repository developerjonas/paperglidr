// apps/web/src/app/api/v1/wishlist/[productId]/route.ts
import { apiError, apiJson, isUuid, requireApiUser, v1Route } from "@/lib/api/v1"
import { removeFromWishlist } from "@/features/wishlist/db/wishlist"

/** Remove a saved product. Removing one that isn't saved is fine. */
export const DELETE = v1Route<{ productId: string }>("remove from wishlist", async (_req, { params }) => {
  const gate = await requireApiUser()
  if (!gate.ok) return gate.response
  const { productId } = await params
  if (!isUuid(productId)) return apiError(404, "Product not found")

  await removeFromWishlist({ userId: gate.user.userId, productId })
  return apiJson({ ok: true, wishlisted: false })
})
