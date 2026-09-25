import { apiJson, v1Route } from "@/lib/api/v1"
import { getPublicCategories } from "@/features/categories/db/categories"

// Public. For the browse screen's category chips; filter with /api/v1/search?categoryId=.
export const GET = v1Route("categories", async () => {
  const categories = await getPublicCategories()
  return apiJson(categories.map(({ id, name, slug }) => ({ id, name, slug })))
})
