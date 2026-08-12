import { db } from "@/drizzle/db"
import {
  LessonTable,
  CourseSectionTable,
  CourseTable,
  UserCourseAccessTable,
} from "@/drizzle/schema"
import { eq, and } from "drizzle-orm"

export type LessonCourseContext = {
  courseId: string
  courseAuthorId: string
}

// Walks Lesson -> CourseSection -> Course. Used by every permission check
// below so the join logic exists in exactly one place.
export async function getLessonCourseContext(
  lessonId: string,
): Promise<LessonCourseContext | null> {
  const [row] = await db
    .select({
      courseId: CourseTable.id,
      courseAuthorId: CourseTable.authorId,
    })
    .from(LessonTable)
    .innerJoin(CourseSectionTable, eq(CourseSectionTable.id, LessonTable.sectionId))
    .innerJoin(CourseTable, eq(CourseTable.id, CourseSectionTable.courseId))
    .where(eq(LessonTable.id, lessonId))
    .limit(1)

  return row ?? null
}

export async function userHasCourseAccess(userId: string, courseId: string) {
  const access = await db.query.UserCourseAccessTable.findFirst({
    where: and(
      eq(UserCourseAccessTable.userId, userId),
      eq(UserCourseAccessTable.courseId, courseId),
    ),
  })
  return access != null
}
