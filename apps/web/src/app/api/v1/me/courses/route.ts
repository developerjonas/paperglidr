// apps/web/src/app/api/v1/me/courses/route.ts
import { apiJson, requireApiUser, v1Route } from "@/lib/api/v1"
import { getCoursesForUser } from "@/features/courses/db/courses"

// Courses the user has access to, with lesson progress.
export const GET = v1Route("my courses", async () => {
  const gate = await requireApiUser()
  if (!gate.ok) return gate.response
  return apiJson(await getCoursesForUser(gate.user.userId))
})
