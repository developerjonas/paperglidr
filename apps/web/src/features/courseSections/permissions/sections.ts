import { db } from "@/drizzle/db"
import { CourseSectionTable, UserRole } from "@/drizzle/schema"
import { eq } from "drizzle-orm"

/**
 * Users can create course sections if they are the author of the course or an admin.
 */
export async function canCreateCourseSections(
  { userId, role }: { userId: string | undefined; role: UserRole | undefined },
  courseId: string
) {
  if (!userId || !courseId) return false
  if (role === "admin") return true

  const course = await db.query.CourseTable.findFirst({
    where: (courses, { eq }) => eq(courses.id, courseId),
  })

  return course?.authorId === userId
}

/**
 * Users can update sections if they are the author of the course or an admin.
 */
export async function canUpdateCourseSections(
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
 * Users can delete sections if they are the author of the course or an admin.
 */
export async function canDeleteCourseSections(
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

export const wherePublicCourseSections = eq(CourseSectionTable.status, "public")
