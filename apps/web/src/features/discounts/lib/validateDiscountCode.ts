import { eq } from "drizzle-orm";
import { db } from "@/drizzle/db";
import { ProductTable } from "@/drizzle/schema";
import { getDiscountCodeByCode, getUserRedemptionCount } from "../db/discounts";

export type DiscountValidationResult =
  | {
      valid: true;
      discountCodeId: string;
      discountType: "percentage" | "fixed";
      amount: number;
      amountOffInRupees: number;
    }
  | {
      valid: false;
      reason:
        | "not_found"
        | "disabled"
        | "expired"
        | "wrong_product"
        | "max_redemptions_reached"
        | "user_limit_reached";
    };

export async function validateDiscountCode(params: {
  code: string;
  userId: string;
  productId: string;
  priceInRupees: number;
}): Promise<DiscountValidationResult> {
  const { code, userId, productId, priceInRupees } = params;

  const discountCode = await getDiscountCodeByCode(code);
  if (!discountCode) return { valid: false, reason: "not_found" };
  if (discountCode.status !== "active") return { valid: false, reason: "disabled" };

  if (discountCode.expiresAt && discountCode.expiresAt.getTime() <= Date.now()) {
    return { valid: false, reason: "expired" };
  }

  if (discountCode.scopeType === "product" && discountCode.productId !== productId) {
    return { valid: false, reason: "wrong_product" };
  }

  // A storewide code covers only the code creator's own products — never
  // another creator's. productId can come from client input (the checkout
  // preview), so the owner is always looked up here, server-side.
  if (discountCode.scopeType === "storewide") {
    const product = await db.query.ProductTable.findFirst({
      where: eq(ProductTable.id, productId),
      columns: { authorId: true },
    });
    if (product == null || product.authorId !== discountCode.creatorId) {
      return { valid: false, reason: "wrong_product" };
    }
  }

  if (
    discountCode.maxRedemptions != null &&
    discountCode.redemptionCount >= discountCode.maxRedemptions
  ) {
    return { valid: false, reason: "max_redemptions_reached" };
  }

  const userRedemptions = await getUserRedemptionCount(discountCode.id, userId);
  if (userRedemptions >= discountCode.maxRedemptionsPerUser) {
    return { valid: false, reason: "user_limit_reached" };
  }

  const amountOffInRupees =
    discountCode.discountType === "percentage"
      ? Math.round((priceInRupees * discountCode.amount) / 100)
      : Math.min(discountCode.amount, priceInRupees);

  return {
    valid: true,
    discountCodeId: discountCode.id,
    discountType: discountCode.discountType,
    amount: discountCode.amount,
    amountOffInRupees,
  };
}
