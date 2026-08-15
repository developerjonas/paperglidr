import { db } from "@/drizzle/db";
import { CourseReviewTable, UserRole } from "@/drizzle/schema";
import { canAccessAdminPages } from "@/permissions/general";
import { eq } from "drizzle-orm";

const COMPLETION_THRESHOLD = 0.5;

/**
 * A user can leave a review once they've completed at least 50% of a
 * course's lessons and haven't already reviewed it (unique constraint
 * backs this up at the DB level too).
 */
export async function canCreateCourseReview(
  { userId }: { userId: string | undefined },
  courseId: string,
) {
  if (!userId || !courseId) return false;

  const existing = await db.query.CourseReviewTable.findFirst({
    where: (reviews, { and, eq }) =>
      and(eq(reviews.userId, userId), eq(reviews.courseId, courseId)),
  });
  if (existing) return false;

  const percentComplete = await getUserCourseCompletionPercent(
    userId,
    courseId,
  );
  return percentComplete >= COMPLETION_THRESHOLD;
}

/**
 * Only the review's author can edit or delete it.
 */
export async function canUpdateCourseReview(
  { userId }: { userId: string | undefined },
  reviewId: string,
) {
  if (!userId || !reviewId) return false;
  const review = await db.query.CourseReviewTable.findFirst({
    where: eq(CourseReviewTable.id, reviewId),
  });
  return review?.userId === userId;
}

export const canDeleteCourseReview = canUpdateCourseReview;

/**
 * Only platform admins can hide a review.
 */
export function canHideCourseReview({ role }: { role: UserRole | undefined }) {
  return canAccessAdminPages({ role });
}

export async function getUserCourseCompletionPercent(
  userId: string,
  courseId: string,
) {
  const sections = await db.query.CourseSectionTable.findMany({
    where: (sections, { eq }) => eq(sections.courseId, courseId),
    with: {
      lessons: {
        with: {
          userLessonsComplete: {
            where: (ulc, { eq }) => eq(ulc.userId, userId),
          },
        },
      },
    },
  });

  const lessons = sections.flatMap((s) => s.lessons);
  if (lessons.length === 0) return 0;

  const completedCount = lessons.filter(
    (l) => l.userLessonsComplete.length > 0,
  ).length;
  return completedCount / lessons.length;
}
