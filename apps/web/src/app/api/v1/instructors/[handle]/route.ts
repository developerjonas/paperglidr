// apps/web/src/app/api/v1/instructors/[handle]/route.ts
import { apiError, apiJson, v1Route } from "@/lib/api/v1"
import { getPublicInstructorByHandle } from "@/features/instructors/db/instructors"

// Public. An instructor's profile and their public products.
export const GET = v1Route<{ handle: string }>("instructor", async (_req, { params }) => {
  const { handle } = await params
  const instructor = await getPublicInstructorByHandle(handle)
  if (!instructor) return apiError(404, "Instructor not found")
  return apiJson(instructor)
})
