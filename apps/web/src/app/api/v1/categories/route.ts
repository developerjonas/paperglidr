import { apiJson, v1Route } from "@/lib/api/v1"
import { getPublicCategories, getPublicCategoryCounts } from "@/features/categories/db/categories"

// Public. For the browse screen's topics; filter with /api/v1/search?categoryId=.
// courseCount: live products in the category.
export const GET = v1Route("categories", async () => {
  const [categories, counts] = await Promise.all([getPublicCategories(), getPublicCategoryCounts()])
  return apiJson(categories.map(({ id, name, slug }) => ({ id, name, slug, courseCount: counts[id] ?? 0 })))
})
