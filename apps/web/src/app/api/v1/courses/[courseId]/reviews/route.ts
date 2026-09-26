import { apiError, apiJson, getApiViewer, isUuid, v1Route } from "@/lib/api/v1"
import { getPublicCourseDetail } from "@/features/courses/db/courses"
import { getLearnerCourse } from "@/features/courses/db/learnerCourse"
import { getCourseReviewSummary, getReviewsForCourse } from "@/features/reviews/db/reviews"

/**
 * A course's reviews, as its page on the website shows them: the summary
 * and every visible review, newest first. `isMine` marks the viewer's own.
 * Public for published courses; a course the viewer has access to also works.
 */
export const GET = v1Route<{ courseId: string }>("course reviews", async (_req, { params }) => {
  const { courseId } = await params
  if (!isUuid(courseId)) return apiError(404, "Course not found")

  const viewer = await getApiViewer()
  const visible =
    (await getPublicCourseDetail(courseId)) != null ||
    (viewer.userId != null &&
      viewer.role != null &&
      (await getLearnerCourse(courseId, { userId: viewer.userId, role: viewer.role })).outcome === "ok")
  if (!visible) return apiError(404, "Course not found")

  const [summary, reviews] = await Promise.all([getCourseReviewSummary(courseId), getReviewsForCourse(courseId)])
  return apiJson({
    averageRating: summary.reviewCount > 0 ? summary.averageRating : null,
    reviewCount: summary.reviewCount,
    reviews: reviews.map(review => ({
      id: review.id,
      rating: review.rating,
      content: review.content,
      instructorReply: review.instructorReply,
      createdAt: review.createdAt,
      edited: review.updatedAt.getTime() !== review.createdAt.getTime(),
      reviewerName: review.user.name,
      reviewerImage: review.user.image,
      isMine: review.userId === viewer.userId,
    })),
  })
})
