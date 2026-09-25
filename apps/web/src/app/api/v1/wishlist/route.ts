// apps/web/src/app/api/v1/wishlist/route.ts
import { z } from "zod"
import { and, eq } from "drizzle-orm"
import { apiError, apiJson, readJson, requireApiUser, v1Route } from "@/lib/api/v1"
import { db } from "@/drizzle/db"
import { ProductTable } from "@/drizzle/schema"
import { wherePublicProducts } from "@/features/products/permissions/products"
import { addToWishlist, getWishlistForUser } from "@/features/wishlist/db/wishlist"

/** The user's saved products, newest first. */
export const GET = v1Route("wishlist", async () => {
  const gate = await requireApiUser()
  if (!gate.ok) return gate.response

  const items = await getWishlistForUser(gate.user.userId)
  return apiJson(
    items.map(item => ({
      wishlistItemId: item.id,
      productId: item.productId,
      name: item.product.name,
      description: item.product.description,
      imageUrl: item.product.imageUrl,
      priceInRupees: item.product.priceInRupees,
      addedAt: item.createdAt,
    })),
  )
})

/** Save a product. Body: { productId }. Saving one already saved is fine. */
export const POST = v1Route("add to wishlist", async req => {
  const gate = await requireApiUser()
  if (!gate.ok) return gate.response

  const input = await readJson(req, z.object({ productId: z.string().uuid() }))
  if (!input.ok) return input.response

  const product = await db.query.ProductTable.findFirst({
    where: and(eq(ProductTable.id, input.data.productId), wherePublicProducts),
    columns: { id: true },
  })
  if (product == null) return apiError(404, "Product not found")

  await addToWishlist({ userId: gate.user.userId, productId: product.id })
  return apiJson({ ok: true, wishlisted: true })
})
