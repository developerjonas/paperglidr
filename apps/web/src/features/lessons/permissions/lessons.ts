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

/**
 * Whether this user may load a lesson's content (video, PDF, attachments).
 * The single rule behind both the lesson page and the delivery route:
 * - admins, and the course's own author: every lesson of that course
 * - "preview" lessons: everyone, including signed-out visitors
 * - "private" lessons: nobody else
 * - "public" lessons: users with access to the course, in a published
 *   (public) section
 * Uncached: every delivery decision reads current access.
 */
export async function canAccessLessonContent(
  { userId, role }: { userId: string | undefined; role: UserRole | undefined },
  lessonId: string,
): Promise<
  | {
      allowed: true
      lesson: { id: string; courseId: string; status: LessonStatus }
      /**
       * True for admins, the course author and users with access to the
       * course; false when the lesson is open only because it's a preview.
       * Hosted (R2 / Bunny) video needs this — see features/lessons/lib/freeTier.
       */
      hasCourseAccess: boolean
    }
  | { allowed: false; reason: "not_found" | "sign_in_required" | "forbidden" }
> {
  const lesson = await db.query.LessonTable.findFirst({
    where: eq(LessonTable.id, lessonId),
    columns: { id: true, status: true },
    with: {
      section: {
        columns: { status: true },
        with: { course: { columns: { id: true, authorId: true } } },
      },
    },
  })
  if (lesson == null) return { allowed: false, reason: "not_found" }
  const ok = (hasCourseAccess: boolean) => ({
    allowed: true as const,
    lesson: { id: lesson.id, courseId: lesson.section.course.id, status: lesson.status },
    hasCourseAccess,
  })

  if (role === "admin") return ok(true)
  if (userId != null && lesson.section.course.authorId === userId) return ok(true)

  const hasAccessRow = async () => {
    if (userId == null) return false
    const access = await db.query.UserCourseAccessTable.findFirst({
      where: and(
        eq(UserCourseAccessTable.userId, userId),
        eq(UserCourseAccessTable.courseId, lesson.section.course.id),
      ),
      columns: { userId: true },
    })
    return access != null
  }

  if (lesson.status === "preview") return ok(await hasAccessRow())
  if (lesson.status === "private" || lesson.section.status !== "public") {
    return { allowed: false, reason: userId == null ? "sign_in_required" : "forbidden" }
  }
  if (userId == null) return { allowed: false, reason: "sign_in_required" }
  return (await hasAccessRow()) ? ok(true) : { allowed: false, reason: "forbidden" }
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
  if (userId == null) return false

  // The course's author can view every lesson of their own course.
  cacheTag(getLessonIdTag(lesson.id))
  const [authored] = await db
    .select({ id: CourseTable.id })
    .from(LessonTable)
    .innerJoin(CourseSectionTable, eq(CourseSectionTable.id, LessonTable.sectionId))
    .innerJoin(CourseTable, eq(CourseTable.id, CourseSectionTable.courseId))
    .where(and(eq(LessonTable.id, lesson.id), eq(CourseTable.authorId, userId)))
    .limit(1)
  if (authored != null) return true

  if (lesson.status === "private") return false

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
