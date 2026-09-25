// apps/web/src/app/api/v1/courses/route.ts
import { apiJson, v1Route } from "@/lib/api/v1"
import { getPublicCourseListings } from "@/features/courses/db/courses"

// Public. GET /api/v1/courses?limit= — the public catalogue (same listing as /api/v1/products).
export const GET = v1Route("courses", async req => {
  const limitParam = Number(new URL(req.url).searchParams.get("limit"))
  const limit = Number.isInteger(limitParam) && limitParam > 0 ? Math.min(limitParam, 100) : undefined
  return apiJson(await getPublicCourseListings({ limit }))
})
