import type { MetadataRoute } from "next"
import { desc, eq } from "drizzle-orm"
import { db } from "@/drizzle/db"
import { ProductTable } from "@/drizzle/schema"
import { SITE_URL } from "@/lib/site"

// Built per request (it reads the catalogue), so the build never needs a DB.
export const dynamic = "force-dynamic"

// Public, indexable pages that aren't generated from data.
const STATIC_PATHS: { path: string; priority: number; changeFrequency: "daily" | "weekly" | "monthly" }[] = [
  { path: "/", priority: 1, changeFrequency: "daily" },
  { path: "/browse", priority: 0.9, changeFrequency: "daily" },
  { path: "/tos", priority: 0.3, changeFrequency: "monthly" },
  { path: "/dmca", priority: 0.3, changeFrequency: "monthly" },
  { path: "/content", priority: 0.3, changeFrequency: "monthly" },
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await db
    .select({ id: ProductTable.id, updatedAt: ProductTable.updatedAt })
    .from(ProductTable)
    .where(eq(ProductTable.status, "public"))
    .orderBy(desc(ProductTable.updatedAt))
    .limit(5000)

  return [
    ...STATIC_PATHS.map(({ path, priority, changeFrequency }) => ({
      url: `${SITE_URL}${path}`,
      priority,
      changeFrequency,
    })),
    ...products.map(product => ({
      url: `${SITE_URL}/products/${product.id}`,
      lastModified: product.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ]
}
