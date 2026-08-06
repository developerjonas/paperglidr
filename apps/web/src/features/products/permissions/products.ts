import { db } from "@/drizzle/db"
import { ProductTable, UserRole } from "@/drizzle/schema"
import { eq } from "drizzle-orm"

/**
 * Any authenticated user can create products (or restricted to authors/admins)
 */
export function canCreateProducts({ userId }: { userId: string | undefined }) {
  return userId != null
}

/**
 * Users can update products if they are the author of the product's courses or an admin.
 * (Adjust query if your ProductTable has an explicit authorId or relation)
 */
export async function canUpdateProducts(
  { userId, role }: { userId: string | undefined; role: UserRole | undefined },
  productId: string
) {
  if (!userId || !productId) return false
  if (role === "admin") return true
  const product = await db.query.ProductTable.findFirst({
    where: eq(ProductTable.id, productId),
  })
  return product?.authorId === userId
}

/**
 * Users can delete products if they are the author or an admin.
 */
export async function canDeleteProducts(
  { userId, role }: { userId: string | undefined; role: UserRole | undefined },
  productId: string
) {
  if (!userId || !productId) return false
  if (role === "admin") return true
  const product = await db.query.ProductTable.findFirst({
    where: eq(ProductTable.id, productId),
  })
  return product?.authorId === userId
}

export const wherePublicProducts = eq(ProductTable.status, "public")
