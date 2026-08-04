import { db } from "@/drizzle/db"
import {
  CourseSectionTable,
  CourseTable,
  LessonStatus,
  LessonTable,
  UserCourseAccessTable,
  UserRole,
} from "@/drizzle/schema"
import { getUserCourseAccessUserTag } from "@/features/courses/db/cache/userCourseAccess"
import { wherePublicCourseSections } from "@/features/courseSections/permissions/sections"
import { and, eq, or } from "drizzle-orm"
import { getLessonIdTag } from "../db/cache/lessons"
import { cacheTag } from "next/dist/server/use-cache/cache-tag"

/**
 * Users can create lessons if they are the author of the course or an admin.
 */
export async function canCreateLessons(
  { userId, role }: { userId: string | undefined; role: UserRole | undefined },
  sectionId: string
) {
  if (!userId || !sectionId) return false
  if (role === "admin") return true

  const section = await db.query.CourseSectionTable.findFirst({
    where: eq(CourseSectionTable.id, sectionId),
    with: {
      course: true,
    },
  })

  return section?.course?.authorId === userId
}

/**
 * Users can update lessons if they are the author of the course or an admin.
 */
export async function canUpdateLessons(
  { userId, role }: { userId: string | undefined; role: UserRole | undefined },
  lessonId: string
) {
  if (!userId || !lessonId) return false
  if (role === "admin") return true

  const lesson = await db.query.LessonTable.findFirst({
    where: eq(LessonTable.id, lessonId),
    with: {
      section: {
        with: {
          course: true,
        },
      },
    },
  })

  return lesson?.section?.course?.authorId === userId
}

/**
 * Users can delete lessons if they are the author of the course or an admin.
 */
export async function canDeleteLessons(
  { userId, role }: { userId: string | undefined; role: UserRole | undefined },
  lessonId: string
) {
  if (!userId || !lessonId) return false
  if (role === "admin") return true

  const lesson = await db.query.LessonTable.findFirst({
    where: eq(LessonTable.id, lessonId),
    with: {
      section: {
        with: {
          course: true,
        },
      },
    },
  })

  return lesson?.section?.course?.authorId === userId
}

export async function canViewLesson(
  {
    role,
    userId,
  }: {
    userId: string | undefined
    role: UserRole | undefined
  },
  lesson: { id: string; status: LessonStatus }
) {
  "use cache"
  if (role === "admin" || lesson.status === "preview") return true
  if (userId == null || lesson.status === "private") return false

  cacheTag(getUserCourseAccessUserTag(userId), getLessonIdTag(lesson.id))

  const [data] = await db
    .select({ courseId: CourseTable.id })
    .from(UserCourseAccessTable)
    .leftJoin(CourseTable, eq(CourseTable.id, UserCourseAccessTable.courseId))
    .leftJoin(
      CourseSectionTable,
      and(
        eq(CourseSectionTable.courseId, CourseTable.id),
        wherePublicCourseSections
      )
    )
    .leftJoin(
      LessonTable,
      and(eq(LessonTable.sectionId, CourseSectionTable.id), wherePublicLessons)
    )
    .where(
      and(
        eq(LessonTable.id, lesson.id),
        eq(UserCourseAccessTable.userId, userId)
      )
    )
    .limit(1)

  return data != null && data.courseId != null
}

export const wherePublicLessons = or(
  eq(LessonTable.status, "public"),
  eq(LessonTable.status, "preview")
)
