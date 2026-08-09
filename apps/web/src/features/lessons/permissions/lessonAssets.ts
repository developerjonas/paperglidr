import { db } from "@/drizzle/db";
import { LessonTable } from "@/drizzle/schema/lesson";
import { eq } from "drizzle-orm";
// ASSUMPTION: permissions/lessons.ts exports something like
// `canUpdateLesson(user, lesson)` or `canUpdateCourse` that this repo's
// LessonForm/action already calls before mutating a lesson. Import and
// reuse that instead of the local check below once you confirm the name —
// asset editing rights should never diverge from lesson editing rights.
// import { canUpdateLesson } from "./lessons";

import { getCurrentUser } from "@/services/clerk"; // adjust: server-side current-user getter, not the client hook

/**
 * Throws if the current user may not add/remove assets on this lesson.
 * Loads lesson -> section -> course to check instructor ownership,
 * matching the join shape used by the delivery route.
 */
export async function canEditLessonAssets(lessonId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const lesson = await db.query.LessonTable.findFirst({
    where: eq(LessonTable.id, lessonId),
    with: { section: { with: { course: true } } },
  });
  if (!lesson) throw new Error("Lesson not found");

  const isOwner = lesson.section.course.authorId === user.userId;
  const isAdmin = user.role === "admin";
  if (!isOwner && !isAdmin) throw new Error("Forbidden");

  return lesson;
}
