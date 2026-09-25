// apps/web/src/app/api/v1/products/route.ts
import { apiJson, v1Route } from "@/lib/api/v1"
import { getPublicProductListings } from "@/features/products/db/products"

// Public. GET /api/v1/products?limit= — every public product. Use
// /api/v1/search for filtering, sorting and pages.
export const GET = v1Route("products", async req => {
  const limitParam = Number(new URL(req.url).searchParams.get("limit"))
  const limit = Number.isInteger(limitParam) && limitParam > 0 ? Math.min(limitParam, 100) : undefined
  return apiJson(await getPublicProductListings({ limit }))
})
