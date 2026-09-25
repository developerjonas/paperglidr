import "server-only"
import { and, asc, eq, inArray } from "drizzle-orm"
import { db } from "@/drizzle/db"
import {
  CourseSectionTable,
  CourseTable,
  LessonTable,
  UserCourseAccessTable,
  UserLessonCompleteTable,
  type UserRole,
} from "@/drizzle/schema"
import { wherePublicCourseSections } from "@/features/courseSections/permissions/sections"
import { wherePublicLessons } from "@/features/lessons/permissions/lessons"
import { getUserReviewForCourse } from "@/features/reviews/db/reviews"

/**
 * The course player's outline for one learner (GET /api/v1/me/courses/[id]):
 * public sections, public and preview lessons, which lessons they've
 * completed, and their own review. Same content rules as the web course
 * page. Uncached: access is read fresh, so a refund removes it at once.
 *
 * "forbidden" = the course exists but the viewer has no access (not bought,
 * not the author, not an admin).
 */
export async function getLearnerCourse(
  courseId: string,
  { userId, role }: { userId: string; role: UserRole },
) {
  const course = await db.query.CourseTable.findFirst({
    where: eq(CourseTable.id, courseId),
    columns: { id: true, name: true, description: true, authorId: true },
  })
  if (course == null) return { outcome: "not_found" as const }

  if (role !== "admin" && course.authorId !== userId) {
    const access = await db.query.UserCourseAccessTable.findFirst({
      where: and(
        eq(UserCourseAccessTable.userId, userId),
        eq(UserCourseAccessTable.courseId, courseId),
      ),
      columns: { userId: true },
    })
    if (access == null) return { outcome: "forbidden" as const }
  }

  const sections = await db
    .select({ id: CourseSectionTable.id, name: CourseSectionTable.name })
    .from(CourseSectionTable)
    .where(and(eq(CourseSectionTable.courseId, courseId), wherePublicCourseSections))
    .orderBy(asc(CourseSectionTable.order))

  const lessons =
    sections.length === 0
      ? []
      : await db
          .select({
            id: LessonTable.id,
            sectionId: LessonTable.sectionId,
            name: LessonTable.name,
            status: LessonTable.status,
          })
          .from(LessonTable)
          .where(
            and(
              inArray(LessonTable.sectionId, sections.map(s => s.id)),
              wherePublicLessons,
            ),
          )
          .orderBy(asc(LessonTable.order))

  const completed =
    lessons.length === 0
      ? []
      : await db
          .select({ lessonId: UserLessonCompleteTable.lessonId })
          .from(UserLessonCompleteTable)
          .where(
            and(
              eq(UserLessonCompleteTable.userId, userId),
              inArray(UserLessonCompleteTable.lessonId, lessons.map(l => l.id)),
            ),
          )
  const completedIds = new Set(completed.map(c => c.lessonId))

  const review = await getUserReviewForCourse(userId, courseId)

  return {
    outcome: "ok" as const,
    course: {
      id: course.id,
      name: course.name,
      description: course.description,
      totalLessons: lessons.length,
      completedLessons: lessons.filter(l => completedIds.has(l.id)).length,
      sections: sections.map(section => ({
        id: section.id,
        name: section.name,
        lessons: lessons
          .filter(l => l.sectionId === section.id)
          .map(l => ({
            id: l.id,
            name: l.name,
            isPreview: l.status === "preview",
            isComplete: completedIds.has(l.id),
          })),
      })),
      myReview:
        review == null
          ? null
          : {
              id: review.id,
              rating: review.rating,
              content: review.content,
              instructorReply: review.instructorReply,
              createdAt: review.createdAt,
              updatedAt: review.updatedAt,
            },
    },
  }
}
