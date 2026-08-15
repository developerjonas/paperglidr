import { db } from "@/drizzle/db";
import { CourseTable, UserCourseAccessTable, UserRole } from "@/drizzle/schema";
import { and, eq } from "drizzle-orm";

export function canAccessAdminPages({ role }: { role: UserRole | undefined }) {
  return role === "admin";
}

/**
 * Checks if a user can purchase a specific course.
 * - Tutors cannot purchase their own course.
 * - Users cannot repurchase a course they already own.
 */
export async function canPurchaseCourse(
  userId: string | undefined,
  courseId: string,
) {
  if (!userId || !courseId) {
    return { allowed: false, reason: "Unauthorized" };
  }

  const course = await db.query.CourseTable.findFirst({
    where: eq(CourseTable.id, courseId),
  });

  if (!course) {
    return { allowed: false, reason: "Course not found" };
  }

  // Tutors cannot buy their own course
  if (course.authorId === userId) {
    return { allowed: false, reason: "You are the tutor of this course." };
  }

  // Check for existing purchase/access
  const existingAccess = await db.query.UserCourseAccessTable.findFirst({
    where: and(
      eq(UserCourseAccessTable.userId, userId),
      eq(UserCourseAccessTable.courseId, courseId),
    ),
  });

  if (existingAccess) {
    return { allowed: false, reason: "You already own this course." };
  }

  return { allowed: true };
}

/**
 * Checks if a user can access and play course contents.
 * - Platform admins have full access.
 * - Tutors have full access to their own courses.
 * - Students have access if they purchased the course.
 */
export async function canPlayCourse(
  userId: string | undefined,
  role: UserRole | undefined,
  courseId: string,
) {
  if (!userId || !courseId) return false;

  // Admins can play any course
  if (role === "admin") return true;

  const course = await db.query.CourseTable.findFirst({
    where: eq(CourseTable.id, courseId),
  });

  if (!course) return false;

  // Tutors can play their own courses
  if (course.authorId === userId) return true;

  // Check if student purchased access
  const access = await db.query.UserCourseAccessTable.findFirst({
    where: and(
      eq(UserCourseAccessTable.userId, userId),
      eq(UserCourseAccessTable.courseId, courseId),
    ),
  });

  return !!access;
}
