// apps/web/src/app/api/v1/courses/[courseId]/route.ts
import { apiError, apiJson, isUuid, v1Route } from "@/lib/api/v1"
import { getPublicCourseDetail } from "@/features/courses/db/courses"

/**
 * Public. A course's outline as the product page shows it (public sections,
 * public and preview lessons). A learner's outline with progress:
 * GET /api/v1/me/courses/[courseId].
 */
export const GET = v1Route<{ courseId: string }>("course", async (_req, { params }) => {
  const { courseId } = await params
  if (!isUuid(courseId)) return apiError(404, "Course not found")
  const course = await getPublicCourseDetail(courseId)
  if (!course) return apiError(404, "Course not found")
  return apiJson(course)
})
