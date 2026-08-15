import { db } from "@/drizzle/db";
import { CourseReviewTable, UserRole } from "@/drizzle/schema";
import { and, avg, count, eq } from "drizzle-orm";
import { cacheTag } from "next/dist/server/use-cache/cache-tag";
import { revalidateCourseReviewCache, getCourseReviewCourseTag } from "./cache";

export async function insertReview(
  data: typeof CourseReviewTable.$inferInsert,
) {
  const [newReview] = await db
    .insert(CourseReviewTable)
    .values(data)
    .returning();
  if (newReview == null) throw new Error("Failed to create review");
  revalidateCourseReviewCache({
    id: newReview.id,
    courseId: newReview.courseId,
    userId: newReview.userId,
  });
  return newReview;
}

export async function updateReview(
  id: string,
  data: Partial<typeof CourseReviewTable.$inferInsert>,
) {
  const [updated] = await db
    .update(CourseReviewTable)
    .set(data)
    .where(eq(CourseReviewTable.id, id))
    .returning();
  if (updated == null) throw new Error("Failed to update review");
  revalidateCourseReviewCache({
    id: updated.id,
    courseId: updated.courseId,
    userId: updated.userId,
  });
  return updated;
}

export async function deleteReview(id: string) {
  const [deleted] = await db
    .delete(CourseReviewTable)
    .where(eq(CourseReviewTable.id, id))
    .returning();
  if (deleted == null) throw new Error("Failed to delete review");
  revalidateCourseReviewCache({
    id: deleted.id,
    courseId: deleted.courseId,
    userId: deleted.userId,
  });
  return deleted;
}

export async function setReviewHidden(id: string, isHidden: boolean) {
  return updateReview(id, { isHidden });
}

export async function getReviewsForCourse(courseId: string) {
  "use cache";
  cacheTag(getCourseReviewCourseTag(courseId));
  return db.query.CourseReviewTable.findMany({
    where: (reviews, { and, eq }) =>
      and(eq(reviews.courseId, courseId), eq(reviews.isHidden, false)),
    orderBy: (reviews, { desc }) => desc(reviews.createdAt),
    with: { user: { columns: { name: true, image: true } } },
  });
}

export async function getCourseReviewSummary(courseId: string) {
  "use cache";
  cacheTag(getCourseReviewCourseTag(courseId));
  const [summary] = await db
    .select({
      averageRating: avg(CourseReviewTable.rating),
      reviewCount: count(CourseReviewTable.id),
    })
    .from(CourseReviewTable)
    .where(
      and(
        eq(CourseReviewTable.courseId, courseId),
        eq(CourseReviewTable.isHidden, false),
      ),
    );

  return {
    averageRating: summary?.averageRating ? Number(summary.averageRating) : 0,
    reviewCount: summary?.reviewCount ?? 0,
  };
}

// Deliberately NOT cached with "use cache" — this is per-user, and mixing
// per-user data into the course-wide cache tag would leak between users.
export async function getUserReviewForCourse(userId: string, courseId: string) {
  return db.query.CourseReviewTable.findFirst({
    where: (reviews, { and, eq }) =>
      and(eq(reviews.userId, userId), eq(reviews.courseId, courseId)),
  });
}

export async function setInstructorReply(id: string, reply: string | null) {
  return updateReview(id, {
    instructorReply: reply,
    instructorReplyAt: reply ? new Date() : null,
  });
}

// Student edits should clear any existing instructor reply, matching Udemy's behavior.
export async function updateReviewContent(
  id: string,
  data: { rating: number; content?: string },
) {
  return updateReview(id, {
    ...data,
    instructorReply: null,
    instructorReplyAt: null,
  });
}

/**
 * All reviews for courses authored by this instructor (or all reviews, for admins).
 * Includes hidden reviews — instructors/admins need to see those too.
 */
export async function getReviewsForInstructor({
  userId,
  role,
  courseId,
}: {
  userId: string;
  role: UserRole | undefined;
  courseId?: string;
}) {
  const isAdmin = role === "admin";
  const reviews = await db.query.CourseReviewTable.findMany({
    where: (reviews, { eq }) =>
      courseId ? eq(reviews.courseId, courseId) : undefined,
    orderBy: (reviews, { desc }) => desc(reviews.createdAt),
    with: {
      user: { columns: { name: true, image: true } },
      course: { columns: { id: true, name: true, authorId: true } },
    },
  });
  return isAdmin
    ? reviews
    : reviews.filter((r) => r.course.authorId === userId);
}
