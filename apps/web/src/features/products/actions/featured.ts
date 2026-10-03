"use server"

import { revalidatePath } from "next/cache"
import { and, eq } from "drizzle-orm"
import { z } from "zod"
import { db } from "@/drizzle/db"
import { ProductTable } from "@/drizzle/schema"
import { requireAdmin } from "@/services/auth"
import { UserFacingError, actionError } from "@/lib/safeError"
import { revalidateProductCache } from "../db/cache"

/**
 * Admin: pin a live course to the top of the home page (and the app's
 * Featured row), or unpin it. Only public products can be featured.
 */
export async function setProductFeatured(productId: string, featured: boolean) {
  await requireAdmin()
  try {
    if (!z.string().uuid().safeParse(productId).success) throw new UserFacingError("Product not found")
    const [product] = await db
      .update(ProductTable)
      .set({ featuredAt: featured ? new Date() : null })
      .where(and(eq(ProductTable.id, productId), eq(ProductTable.status, "public")))
      .returning({ id: ProductTable.id })
    if (!product) throw new UserFacingError("Only live courses can be featured")
    revalidateProductCache(product.id)
    revalidatePath("/admin/products")
    return { error: false as const, message: featured ? "Featured on the home page" : "No longer featured" }
  } catch (error) {
    return actionError(error, "setProductFeatured")
  }
}
