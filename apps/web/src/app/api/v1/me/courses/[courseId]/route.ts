import { apiError, apiJson, isUuid, requireApiUser, v1Route } from "@/lib/api/v1"
import { getLearnerCourse } from "@/features/courses/db/learnerCourse"
import {
  canCreateCourseReview,
  getUserCourseCompletionPercent,
} from "@/features/reviews/permissions/reviews"

/**
 * The course player's outline: sections, lessons with completion, progress,
 * the viewer's own review and whether they may write one (50% completed). 403 if they don't have access to the course.
 * Open a lesson with GET /api/v1/lessons/[lessonId].
 */
export const GET = v1Route<{ courseId: string }>("my course", async (_req, { params }) => {
  const gate = await requireApiUser()
  if (!gate.ok) return gate.response

  const { courseId } = await params
  if (!isUuid(courseId)) return apiError(404, "Course not found")
  const result = await getLearnerCourse(courseId, gate.user)
  if (result.outcome === "not_found") return apiError(404, "Course not found")
  if (result.outcome === "forbidden") return apiError(403, "Buy this course to open it")

  // The website's rule: a review needs 50% of the course completed.
  const [canWriteReview, completion] = await Promise.all([
    canCreateCourseReview({ userId: gate.user.userId }, courseId),
    getUserCourseCompletionPercent(gate.user.userId, courseId),
  ])
  return apiJson({
    ...result.course,
    review: {
      canWrite: canWriteReview,
      completionPercent: Math.round(completion * 100),
      requiredPercent: 50,
    },
  })
})
