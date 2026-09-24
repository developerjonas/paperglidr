import "server-only"
import { and, eq, inArray, isNull } from "drizzle-orm"
import { db } from "@/drizzle/db"
import { CourseProductTable, PurchaseTable, UserCourseAccessTable } from "@/drizzle/schema"

/**
 * Uncached (checkout must see the current state). Owned = a completed,
 * not refunded purchase of this product, or course access to every course
 * in it (e.g. bought as part of another bundle, or granted by an admin).
 */
export async function alreadyOwnsProduct({ userId, productId }: { userId: string; productId: string }) {
  const purchase = await db.query.PurchaseTable.findFirst({
    where: and(
      eq(PurchaseTable.userId, userId),
      eq(PurchaseTable.productId, productId),
      eq(PurchaseTable.status, "completed"),
      isNull(PurchaseTable.refundedAt),
    ),
    columns: { id: true },
  })
  if (purchase != null) return true

  const courseIds = (
    await db
      .select({ courseId: CourseProductTable.courseId })
      .from(CourseProductTable)
      .where(eq(CourseProductTable.productId, productId))
  ).map(row => row.courseId)
  if (courseIds.length === 0) return false

  const access = await db
    .select({ courseId: UserCourseAccessTable.courseId })
    .from(UserCourseAccessTable)
    .where(and(eq(UserCourseAccessTable.userId, userId), inArray(UserCourseAccessTable.courseId, courseIds)))
  return new Set(access.map(row => row.courseId)).size === courseIds.length
}
