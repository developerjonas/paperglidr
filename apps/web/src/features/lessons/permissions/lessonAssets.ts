import { db } from "@/drizzle/db";
import { LessonTable } from "@/drizzle/schema/lesson";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/services/clerk";
import { canUpdateLessons } from "./lessons";

/**
 * Throws if the current user may not add/remove assets on this lesson.
 * Reuses canUpdateLessons rather than re-deriving instructor ownership —
 * asset editing rights should never diverge from lesson editing rights.
 */
export async function canEditLessonAssets(lessonId: string) {
  const user = await getCurrentUser();

  if (!(await canUpdateLessons(user, lessonId))) {
    throw new Error("Forbidden");
  }

  const lesson = await db.query.LessonTable.findFirst({
    where: eq(LessonTable.id, lessonId),
    with: { section: { with: { course: true } } },
  });
  if (!lesson) throw new Error("Lesson not found");

  return lesson;
}
