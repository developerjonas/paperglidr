import { db } from "@/drizzle/db"
import { CategoryTable, ProductTable } from "@/drizzle/schema"
import { count, eq } from "drizzle-orm"
import { getProductGlobalTag } from "@/features/products/db/cache"
import { cacheTag } from "next/dist/server/use-cache/cache-tag"
import { getCategoryGlobalTag } from "./cache"

export async function getPublicCategories() {
  "use cache"
  cacheTag(getCategoryGlobalTag())

  return db.select().from(CategoryTable).orderBy(CategoryTable.name)
}

/** Live (public) products per category id, for the topic cards on /browse and the app. */
export async function getPublicCategoryCounts(): Promise<Record<string, number>> {
  "use cache"
  cacheTag(getCategoryGlobalTag(), getProductGlobalTag())

  const rows = await db
    .select({ categoryId: ProductTable.categoryId, n: count() })
    .from(ProductTable)
    .where(eq(ProductTable.status, "public"))
    .groupBy(ProductTable.categoryId)
  return Object.fromEntries(rows.filter((r) => r.categoryId != null).map((r) => [r.categoryId!, r.n]))
}
