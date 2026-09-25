import { z } from "zod"
import { and, eq } from "drizzle-orm"
import { apiError, apiJson, readJson, requireApiUser, v1Route } from "@/lib/api/v1"
import { db } from "@/drizzle/db"
import { ProductTable } from "@/drizzle/schema"
import { wherePublicProducts } from "@/features/products/permissions/products"
import { applyDiscountCode } from "@/features/discounts/actions/discounts"

/**
 * Previews a discount code for the checkout screen. Nothing is reserved:
 * pass the code to POST /api/v1/checkout, which checks it again.
 * Body: { code, productId }.
 */
export const POST = v1Route("preview discount", async req => {
  const gate = await requireApiUser()
  if (!gate.ok) return gate.response

  const input = await readJson(req, z.object({
    code: z.string().trim().min(1).max(64),
    productId: z.string().uuid(),
  }))
  if (!input.ok) return input.response

  // The price comes from the database, never from the app.
  const product = await db.query.ProductTable.findFirst({
    where: and(eq(ProductTable.id, input.data.productId), wherePublicProducts),
    columns: { id: true, priceInRupees: true },
  })
  if (product == null) return apiError(404, "Product not found")

  const result = await applyDiscountCode({
    code: input.data.code,
    productId: product.id,
    priceInRupees: product.priceInRupees,
  })
  if (result.error) return apiError(400, result.message)

  return apiJson({
    code: input.data.code,
    discountType: result.discountType,
    amount: result.amount,
    priceInRupees: product.priceInRupees,
    amountOffInRupees: result.amountOffInRupees,
    finalPriceInRupees: Math.max(0, product.priceInRupees - result.amountOffInRupees),
  })
})
