import { UserRole } from "@/drizzle/schema"
import { getLessonCourseContext, userHasCourseAccess } from "../lib/lessonAccess"

type UserContext = { userId: string | undefined; role: UserRole | undefined }

// Viewing only requires being signed in — no purchase check, no DB query
// at all. This is deliberately synchronous; don't add an await here later
// without a reason, since the whole point of this tier is "cheap and
// permissive."
export function canViewLessonQuestions(user: UserContext): boolean {
  return user.userId != null
}

// Asking is purchaser-only. Explicitly NOT extended to the course author
// or admin — an instructor asking a question on their own course isn't a
// real product behavior. If that ever changes, this is the one function
// to loosen.
export async function canAskLessonQuestion(
  user: UserContext,
  lessonId: string,
): Promise<boolean> {
  if (!user.userId) return false

  const context = await getLessonCourseContext(lessonId)
  if (context == null) return false

  return userHasCourseAccess(user.userId, context.courseId)
}

// Replying: any purchaser, OR the course author (whose replies get the
// instructor badge), OR admin. Distinct from canAskLessonQuestion because
// the author CAN reply even though they can't ask.
export async function canReplyToLessonQuestion(
  user: UserContext,
  lessonId: string,
): Promise<boolean> {
  if (!user.userId) return false
  if (user.role === "admin") return true

  const context = await getLessonCourseContext(lessonId)
  if (context == null) return false
  if (context.courseAuthorId === user.userId) return true

  return userHasCourseAccess(user.userId, context.courseId)
}
