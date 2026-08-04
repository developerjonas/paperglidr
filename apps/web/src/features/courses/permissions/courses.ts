import { db } from "@/drizzle/db"
import { CourseTable } from "@/drizzle/schema/course"
import { UserRole } from "@/drizzle/schema/user"
import { eq } from "drizzle-orm"

/**
 * Any logged-in user can create a course on the fly.
 */
export function canCreateCourses({ userId }: { userId: string | undefined }) {
  return userId != null
}

/**
 * Users can update a course if they are the author OR a platform admin.
 */
export async function canUpdateCourses(
  { userId, role }: { userId: string | undefined; role: UserRole | undefined },
  courseId: string
) {
  if (!userId || !courseId) return false
  if (role === "admin") return true

  const course = await db.query.CourseTable.findFirst({
    where: eq(CourseTable.id, courseId),
  })

  return course?.authorId === userId
}

/**
 * Users can delete a course if they are the author OR a platform admin.
 */
export async function canDeleteCourses(
  { userId, role }: { userId: string | undefined; role: UserRole | undefined },
  courseId: string
) {
  if (!userId || !courseId) return false
  if (role === "admin") return true

  const course = await db.query.CourseTable.findFirst({
    where: eq(CourseTable.id, courseId),
  })

  return course?.authorId === userId
}
