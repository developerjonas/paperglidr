import { and, eq } from "drizzle-orm"
import { z } from "zod"
import { apiError, apiJson, isUuid, readJson, requireApiUser, v1Route } from "@/lib/api/v1"
import { db } from "@/drizzle/db"
import { ProductTable } from "@/drizzle/schema"
import { wherePublicProducts } from "@/features/products/permissions/products"
import { enrollFree } from "@/features/purchases/lib/freeEnrollment"
import { alreadyOwnsProduct } from "@/features/purchases/lib/ownership"

const enrollSchema = z.object({
  // One random UUID per course screen, reused on retries: a double tap
  // returns the same enrollment instead of a second one.
  checkoutId: z.string().uuid(),
})

/**
 * Enrolls the signed-in user in a FREE course: a live product priced Rs 0,
 * checked here on the server. It never takes payment and refuses paid
 * products, so the app stays clear of store payment rules (free content
 * may be unlocked without in-app purchase). Same enrollment as the
 * website's "Enroll for free": a completed purchase with gateway "free".
 */
export const POST = v1Route<{ productId: string }>("enroll free", async (req, { params }) => {
  const gate = await requireApiUser()
  if (!gate.ok) return gate.response
  const { userId } = gate.user

  const { productId } = await params
  if (!isUuid(productId)) return apiError(404, "Course not found")
  const input = await readJson(req, enrollSchema)
  if (!input.ok) return input.response

  const product = await db.query.ProductTable.findFirst({
    where: and(eq(ProductTable.id, productId), wherePublicProducts),
    columns: { id: true, name: true, description: true, imageUrl: true, priceInRupees: true },
  })
  if (product == null) return apiError(404, "Course not found")
  if (product.priceInRupees !== 0) return apiError(400, "This course isn't free.")

  if (await alreadyOwnsProduct({ userId, productId })) {
    return apiJson({ enrolled: true, alreadyEnrolled: true })
  }

  await enrollFree({ userId, product, idempotencyKey: `free:${productId}:${input.data.checkoutId}` })
  return apiJson({ enrolled: true, alreadyEnrolled: false }, 201)
})
