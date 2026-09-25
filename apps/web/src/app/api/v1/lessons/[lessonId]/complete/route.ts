// apps/web/src/app/api/v1/lessons/[lessonId]/complete/route.ts
import { actionResponse, apiError, isUuid, requireApiUser, v1Route } from "@/lib/api/v1"
import { updateLessonCompleteStatus } from "@/features/lessons/actions/userLessonComplete"
import { getLessonCourseId } from "@/features/lessons/db/lessons"
import { getCertificateByUserAndCourse } from "@/features/certificates/db/certificates"

// Same action as the web player, so completing the last lesson issues the
// course certificate here too. The response carries it once issued.
async function setComplete(lessonId: string, userId: string, complete: boolean) {
  const result = await updateLessonCompleteStatus(lessonId, complete)
  if (result.error) return actionResponse(result, { errorStatus: 403 })

  const courseId = await getLessonCourseId(lessonId)
  const certificate =
    courseId == null ? null : await getCertificateByUserAndCourse({ userId, courseId })
  return actionResponse(result, {
    body: {
      isComplete: complete,
      certificate:
        certificate == null || certificate.revokedAt != null
          ? null
          : { id: certificate.id, certificateCode: certificate.certificateCode, issuedAt: certificate.issuedAt },
    },
  })
}

type Params = { lessonId: string }

/** Mark the lesson complete. */
export const POST = v1Route<Params>("complete lesson", async (_req, { params }) => {
  const gate = await requireApiUser()
  if (!gate.ok) return gate.response
  const { lessonId } = await params
  if (!isUuid(lessonId)) return apiError(404, "Lesson not found")
  return setComplete(lessonId, gate.user.userId, true)
})

/** Mark the lesson not complete. */
export const DELETE = v1Route<Params>("uncomplete lesson", async (_req, { params }) => {
  const gate = await requireApiUser()
  if (!gate.ok) return gate.response
  const { lessonId } = await params
  if (!isUuid(lessonId)) return apiError(404, "Lesson not found")
  return setComplete(lessonId, gate.user.userId, false)
})
