import { db } from "@/drizzle/db";
import { PurchaseTable } from "@/drizzle/schema/purchase";
import { UserLessonCompleteTable } from "@/drizzle/schema/userLessonComplete";
import { LessonTable } from "@/drizzle/schema/lesson";
import { CourseSectionTable } from "@/drizzle/schema/courseSection";
import { CourseProductTable } from "@/drizzle/schema/courseProduct";
import { and, asc, count, eq, inArray } from "drizzle-orm";
import { wherePublicCourseSections } from "@/features/courseSections/permissions/sections";
import { wherePublicLessons } from "@/features/lessons/permissions/lessons";
import {
  REFUND_COMPLETION_THRESHOLD_PERCENT,
  REFUND_WINDOW_MS,
} from "./refundTerms";

export { REFUND_COMPLETION_THRESHOLD_PERCENT, REFUND_WINDOW_MS };

export type RefundEligibility = {
  eligible: boolean;
  withinWindow: boolean;
  completionPercent: number; // 0-100, across every course in the purchase
  msRemaining: number; // negative once the window has closed
  // The product's courses (a bundle has several). Empty if the product no
  // longer has any.
  courseIds: string[];
  reason?: "not_refundable" | "window_closed" | "completion_too_high";
};

/**
 * The refund rule (see /refund-policy): a completed, paid, not yet refunded
 * purchase, requested within REFUND_WINDOW_MS of the order, with strictly
 * less than REFUND_COMPLETION_THRESHOLD_PERCENT of its lessons complete.
 * For a bundle, completion is measured across all of its courses together:
 * completed lessons in the bundle / lessons in the bundle.
 */
export async function getRefundEligibility(
  purchaseId: string,
): Promise<RefundEligibility> {
  const purchase = await db.query.PurchaseTable.findFirst({
    where: eq(PurchaseTable.id, purchaseId),
  });
  if (purchase == null) throw new Error("Purchase not found");

  const msElapsed = Date.now() - purchase.createdAt.getTime();
  const msRemaining = REFUND_WINDOW_MS - msElapsed;
  const withinWindow = msElapsed <= REFUND_WINDOW_MS;

  const courseIds = (
    await db
      .select({ courseId: CourseProductTable.courseId })
      .from(CourseProductTable)
      .where(eq(CourseProductTable.productId, purchase.productId))
      .orderBy(asc(CourseProductTable.courseId))
  ).map((row) => row.courseId);

  const completionPercent = await getCompletionPercent(purchase.userId, courseIds);
  const completionOk = completionPercent < REFUND_COMPLETION_THRESHOLD_PERCENT;

  // Only money we actually took and haven't given back can be refunded.
  const refundable =
    purchase.status === "completed" &&
    purchase.refundedAt == null &&
    purchase.pricePaidInPaisa > 0 &&
    courseIds.length > 0;

  return {
    eligible: refundable && withinWindow && completionOk,
    withinWindow,
    completionPercent: Math.round(completionPercent * 100) / 100,
    msRemaining,
    courseIds,
    reason: !refundable
      ? "not_refundable"
      : !withinWindow
        ? "window_closed"
        : !completionOk
          ? "completion_too_high"
          : undefined,
  };
}

// Lessons the buyer can actually see: public/preview lessons in public
// sections of the purchase's courses.
async function getCompletionPercent(
  userId: string,
  courseIds: string[],
): Promise<number> {
  if (courseIds.length === 0) return 0;

  const inPurchase = and(
    inArray(CourseSectionTable.courseId, courseIds),
    wherePublicCourseSections,
    wherePublicLessons,
  );

  const [total] = await db
    .select({ n: count(LessonTable.id) })
    .from(LessonTable)
    .innerJoin(CourseSectionTable, eq(LessonTable.sectionId, CourseSectionTable.id))
    .where(inPurchase);
  const totalLessons = total?.n ?? 0;
  if (totalLessons === 0) return 0;

  const [completed] = await db
    .select({ n: count(UserLessonCompleteTable.lessonId) })
    .from(UserLessonCompleteTable)
    .innerJoin(LessonTable, eq(UserLessonCompleteTable.lessonId, LessonTable.id))
    .innerJoin(CourseSectionTable, eq(LessonTable.sectionId, CourseSectionTable.id))
    .where(and(eq(UserLessonCompleteTable.userId, userId), inPurchase));

  return ((completed?.n ?? 0) / totalLessons) * 100;
}
