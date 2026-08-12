import { db } from "@/drizzle/db"
import { CourseTable } from "@/drizzle/schema/course"
import { UserRole } from "@/drizzle/schema/user"
import { eq } from "drizzle-orm"
import { canCreateCourse } from "../lib/canCreateCourse"

/**
 * Any logged-in user can attempt to create a course — the actual cap
 * (canCreateCourse, checked separately in the action) decides whether
 * this specific attempt succeeds. Kept as a fast, synchronous gate so a
 * signed-out request never reaches the DB-backed cap check at all.
 */
export function canCreateCourses({ userId }: { userId: string | undefined }) {
  return userId != null
}

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

export { canCreateCourse }
