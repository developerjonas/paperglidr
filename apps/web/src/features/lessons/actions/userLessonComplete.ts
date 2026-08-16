"use server"
import { getCurrentUser } from "@/services/auth"
import { canUpdateUserLessonCompleteStatus } from "../permissions/userLessonComplete"
import { updateLessonCompleteStatus as updateLessonCompleteStatusDb } from "../db/userLessonComplete"
import { getLessonCourseId } from "../db/lessons"
import { issueCertificateIfEligible } from "@/features/certificates/db/certificates"

export async function updateLessonCompleteStatus(
  lessonId: string,
  complete: boolean
) {
  const { userId } = await getCurrentUser()
  const hasPermission = await canUpdateUserLessonCompleteStatus(
    { userId },
    lessonId
  )
  if (userId == null || !hasPermission) {
    return { error: true, message: "Error updating lesson completion status" }
  }

  await updateLessonCompleteStatusDb({ lessonId, userId, complete })

  // Only check certificate eligibility on completion, not un-completion —
  // and only if we can resolve which course this lesson belongs to
  if (complete) {
    const courseId = await getLessonCourseId(lessonId)
    if (courseId != null) {
      await issueCertificateIfEligible({ userId, courseId })
    }
  }

  return {
    error: false,
    message: "Successfully updated lesson completion status",
  }

}
