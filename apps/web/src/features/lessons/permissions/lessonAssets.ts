import { db } from "@/drizzle/db";
import { LessonTable } from "@/drizzle/schema/lesson";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/services/auth";
import { canUpdateLessons } from "./lessons";
import { UserFacingError } from "@/lib/safeError";

/**
 * Throws UserFacingError if the current user may not add/remove assets on
 * this lesson.
 * Reuses canUpdateLessons rather than re-deriving instructor ownership —
 * asset editing rights should never diverge from lesson editing rights.
 */
export async function canEditLessonAssets(lessonId: string) {
  const user = await getCurrentUser();

  // UserFacingError: an unauthorized attempt is an expected outcome, not a
  // bug — safeError returns the message instead of logging/reporting it.
  if (!(await canUpdateLessons(user, lessonId))) {
    throw new UserFacingError("You can't edit this lesson.");
  }

  const lesson = await db.query.LessonTable.findFirst({
    where: eq(LessonTable.id, lessonId),
    with: { section: { with: { course: true } } },
  });
  if (!lesson) throw new UserFacingError("Lesson not found");

  return lesson;
}
