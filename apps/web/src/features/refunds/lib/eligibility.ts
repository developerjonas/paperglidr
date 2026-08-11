import { db } from "@/drizzle/db";
import { PurchaseTable } from "@/drizzle/schema/purchase";
import { UserLessonCompleteTable } from "@/drizzle/schema/userLessonComplete";
import { LessonTable } from "@/drizzle/schema/lesson";
import { CourseSectionTable } from "@/drizzle/schema/courseSection";
import { and, eq, count } from "drizzle-orm";

// Exactly 7 * 24 * 60 * 60 * 1000ms. Deliberately NOT "start of day" or
// calendar-day math — 1ms past this and the request is outside the window.
const REFUND_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

// Strictly under 20%, not "20% or less".
const REFUND_COMPLETION_THRESHOLD_PERCENT = 20;

export type RefundEligibility = {
  eligible: boolean;
  withinWindow: boolean;
  completionPercent: number; // 0-100
  msRemaining: number; // negative once the window has closed
  reason?: "window_closed" | "completion_too_high";
};

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

  // ASSUMPTION: purchase maps to a single course via `purchase.productId`
  // resolving 1:1 to a course. If a product can bundle multiple courses,
  // this needs to aggregate completion across every course in the bundle
  // instead. Adjust the field name below to match your actual schema.
  const courseId = purchase.productId;

  const completionPercent = await getCourseCompletionPercent(
    purchase.userId,
    courseId,
  );
  const completionOk = completionPercent < REFUND_COMPLETION_THRESHOLD_PERCENT;

  const eligible = withinWindow && completionOk;

  return {
    eligible,
    withinWindow,
    completionPercent: Math.round(completionPercent * 100) / 100,
    msRemaining,
    reason: !withinWindow
      ? "window_closed"
      : !completionOk
        ? "completion_too_high"
        : undefined,
  };
}

async function getCourseCompletionPercent(
  userId: string,
  courseId: string,
): Promise<number> {
  const totalLessonsResult = await db
    .select({ totalLessons: count(LessonTable.id) })
    .from(LessonTable)
    .innerJoin(
      CourseSectionTable,
      eq(LessonTable.sectionId, CourseSectionTable.id),
    )
    .where(eq(CourseSectionTable.courseId, courseId));

  const totalLessons = totalLessonsResult[0]?.totalLessons ?? 0;
  if (totalLessons === 0) return 0;

  const completedLessonsResult = await db
    .select({ completedLessons: count(UserLessonCompleteTable.lessonId) })
    .from(UserLessonCompleteTable)
    .innerJoin(
      LessonTable,
      eq(UserLessonCompleteTable.lessonId, LessonTable.id),
    )
    .innerJoin(
      CourseSectionTable,
      eq(LessonTable.sectionId, CourseSectionTable.id),
    )
    .where(
      and(
        eq(UserLessonCompleteTable.userId, userId),
        eq(CourseSectionTable.courseId, courseId),
      ),
    );

  const completedLessons = completedLessonsResult[0]?.completedLessons ?? 0;

  return (completedLessons / totalLessons) * 100;
}
