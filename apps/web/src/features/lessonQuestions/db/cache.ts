import { getGlobalTag, getIdTag } from "@/lib/dataCache"
import { revalidateTag } from "next/cache"

export function getLessonQuestionsGlobalTag() {
  return getGlobalTag("lessonQuestions")
}

// Tagged by lessonId, not per-question — the only read this feature does
// is "every question + reply for this lesson," so there's no separate
// per-question cache entry to invalidate independently.
export function getLessonQuestionsLessonTag(lessonId: string) {
  return getIdTag("lessonQuestions", lessonId)
}

export function revalidateLessonQuestionsCache(lessonId: string) {
  revalidateTag(getLessonQuestionsGlobalTag())
  revalidateTag(getLessonQuestionsLessonTag(lessonId))
}
