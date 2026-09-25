import { actionResponse, apiError, isUuid, readJson, requireApiUser, v1Route } from "@/lib/api/v1"
import { createReview, deleteReview, updateReview } from "@/features/reviews/actions/reviews"
import { reviewSchema } from "@/features/reviews/schemas/reviews"
import { getUserReviewForCourse } from "@/features/reviews/db/reviews"

/**
 * The signed-in user's review of a course — one per course. Reading it:
 * `myReview` in GET /api/v1/me/courses/[courseId].
 * Body for POST/PUT: { rating: 1-5, content? } (content up to 2000 characters).
 */
type Params = { courseId: string }

async function ownReviewId(courseId: string, userId: string) {
  return (await getUserReviewForCourse(userId, courseId))?.id ?? null
}

/** Write a review. Needs at least 50% of the course completed. */
export const POST = v1Route<Params>("create review", async (req, { params }) => {
  const gate = await requireApiUser()
  if (!gate.ok) return gate.response
  const { courseId } = await params
  if (!isUuid(courseId)) return apiError(404, "Course not found")

  const input = await readJson(req, reviewSchema)
  if (!input.ok) return input.response
  if ((await ownReviewId(courseId, gate.user.userId)) != null) {
    return apiError(409, "You've already reviewed this course. Update it instead.")
  }

  const result = await createReview(courseId, input.data)
  return actionResponse(result, { errorStatus: 403, successStatus: 201 })
})

/** Edit your review. Clears the instructor's reply, as on the web. */
export const PUT = v1Route<Params>("update review", async (req, { params }) => {
  const gate = await requireApiUser()
  if (!gate.ok) return gate.response
  const { courseId } = await params
  if (!isUuid(courseId)) return apiError(404, "Course not found")

  const input = await readJson(req, reviewSchema)
  if (!input.ok) return input.response
  const reviewId = await ownReviewId(courseId, gate.user.userId)
  if (reviewId == null) return apiError(404, "You haven't reviewed this course")

  return actionResponse(await updateReview(reviewId, input.data), { errorStatus: 403 })
})

/** Delete your review. */
export const DELETE = v1Route<Params>("delete review", async (_req, { params }) => {
  const gate = await requireApiUser()
  if (!gate.ok) return gate.response
  const { courseId } = await params
  if (!isUuid(courseId)) return apiError(404, "Course not found")

  const reviewId = await ownReviewId(courseId, gate.user.userId)
  if (reviewId == null) return apiError(404, "You haven't reviewed this course")

  return actionResponse(await deleteReview(reviewId), { errorStatus: 403 })
})
