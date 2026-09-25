import { apiError, apiJson, v1Route } from "@/lib/api/v1"
import { searchQuerySchema } from "@/features/search/schemas/search"
import { searchProducts } from "@/features/search/db/search"

const num = (value: string | null) => (value == null || value === "" ? undefined : Number(value))

/**
 * Public. GET /api/v1/search?q=&categoryId=&minPrice=&maxPrice=&minRating=&sort=&page=
 * sort: relevance | rating | newest | price_asc | price_desc. 20 per page.
 */
export const GET = v1Route("search", async req => {
  const params = new URL(req.url).searchParams
  const parsed = searchQuerySchema.safeParse({
    q: params.get("q") ?? undefined,
    categoryId: params.get("categoryId") ?? undefined,
    minPrice: num(params.get("minPrice")),
    maxPrice: num(params.get("maxPrice")),
    minRating: num(params.get("minRating")),
    sort: params.get("sort") ?? undefined,
    page: num(params.get("page")),
  })
  if (!parsed.success) {
    return apiError(400, parsed.error.issues[0]?.message ?? "Invalid search")
  }

  const rows = await searchProducts(parsed.data)
  return apiJson({
    page: parsed.data.page,
    results: rows.map(({ product, avgRating, reviewCount }) => ({
      id: product.id,
      name: product.name,
      description: product.description,
      imageUrl: product.imageUrl,
      priceInRupees: product.priceInRupees,
      categoryId: product.categoryId,
      avgRating: avgRating ? Number(avgRating) : null,
      reviewCount,
    })),
  })
})
