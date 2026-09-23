import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/drizzle/db";
import { CourseProductTable } from "@/drizzle/schema";
import { addUserCourseAccess } from "@/features/courses/db/userCourseAccess";
import { recordDiscountRedemption } from "@/features/discounts/db/discounts";
import { insertPurchase } from "../db/purchases";

/**
 * Enrolls a user in a product whose SERVER-COMPUTED price is zero — a free
 * product, or a paid one discounted to nothing. One transaction: a
 * purchase born "completed" with gateway "free" (no money moved, so there
 * is nothing to verify), course access, and the discount redemption.
 *
 * Callers must have computed the zero price themselves; nothing here trusts
 * the client about price or gateway.
 */
export async function enrollFree({
  userId,
  product,
  idempotencyKey,
  referredByInstructorId = null,
  discount = null,
}: {
  userId: string;
  product: { id: string; name: string; description: string; imageUrl: string };
  idempotencyKey: string;
  referredByInstructorId?: string | null;
  discount?: { discountCodeId: string; discountAmountPaisa: number } | null;
}) {
  return db.transaction(async trx => {
    const purchase = await insertPurchase(
      {
        userId,
        productId: product.id,
        productDetails: {
          name: product.name,
          description: product.description,
          imageUrl: product.imageUrl,
        },
        pricePaidInPaisa: 0,
        gateway: "free",
        status: "completed",
        gatewayCheckoutId: idempotencyKey,
        idempotencyKey,
        referredByInstructorId,
        discountCodeId: discount?.discountCodeId ?? null,
        discountAmountPaisa: discount?.discountAmountPaisa ?? 0,
      },
      trx,
    );
    // Same checkout submitted twice: the first one already enrolled.
    if (purchase == null) return null;

    const courseProducts = await trx.query.CourseProductTable.findMany({
      where: eq(CourseProductTable.productId, product.id),
      columns: { courseId: true },
    });
    await addUserCourseAccess(
      { userId, courseIds: courseProducts.map(cp => cp.courseId) },
      trx,
    );

    if (discount != null) {
      await recordDiscountRedemption(
        {
          discountCodeId: discount.discountCodeId,
          userId,
          purchaseId: purchase.id,
          amountDiscountedInPaisa: discount.discountAmountPaisa,
        },
        trx,
      );
    }

    return purchase;
  });
}
