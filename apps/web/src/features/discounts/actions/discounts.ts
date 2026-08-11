"use server";

import { z } from "zod";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/drizzle/db";
import { UserTable } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import {
  insertDiscountCode,
  updateDiscountCode as updateDiscountCodeDb,
  deleteDiscountCode as deleteDiscountCodeDb,
} from "../db/discounts";
import {
  canCreateDiscountCodes,
  canUpdateDiscountCodes,
  canDeleteDiscountCodes,
} from "../permissions/discounts";
import { discountCodeSchema } from "../schemas/discounts";
import { validateDiscountCode } from "../lib/validateDiscountCode";

async function getCurrentUserContext() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) return { userId: undefined, role: undefined };

  const [dbUser] = await db
    .select({ role: UserTable.role })
    .from(UserTable)
    .where(eq(UserTable.id, session.user.id))
    .limit(1);

  return { userId: session.user.id, role: dbUser?.role };
}

export async function createDiscountCode(
  unsafeData: z.infer<typeof discountCodeSchema>,
) {
  const { success, data } = discountCodeSchema.safeParse(unsafeData);
  const user = await getCurrentUserContext();

  if (!success || !canCreateDiscountCodes(user)) {
    return { error: true, message: "There was an error creating your discount code" };
  }

  try {
    await insertDiscountCode({ ...data, creatorId: user.userId! });
  } catch {
    // Most likely failure: unique index on `code`.
    return { error: true, message: "That code is already taken" };
  }

  return { error: false, message: "Discount code created" };
}

export async function updateDiscountCodeAction(
  id: string,
  unsafeData: z.infer<typeof discountCodeSchema>,
) {
  const { success, data } = discountCodeSchema.safeParse(unsafeData);
  const user = await getCurrentUserContext();

  if (!success || !(await canUpdateDiscountCodes(user, id))) {
    return { error: true, message: "There was an error updating your discount code" };
  }

  await updateDiscountCodeDb(id, data);
  return { error: false, message: "Discount code updated" };
}

export async function deleteDiscountCodeAction(id: string) {
  const user = await getCurrentUserContext();

  if (!(await canDeleteDiscountCodes(user, id))) {
    return { error: true, message: "Error deleting discount code" };
  }

  await deleteDiscountCodeDb(id);
  return { error: false, message: "Discount code deleted" };
}

// Consumer-facing: attempt to apply a code at checkout. Any signed-in user
// can try — actual eligibility (expiry, limits, product match) is decided
// in validateDiscountCode. Does NOT record a redemption; that happens in
// purchases/actions/purchases.ts once payment is confirmed.
export async function applyDiscountCode(params: {
  code: string;
  productId: string;
  priceInRupees: number;
}) {
  const user = await getCurrentUserContext();
  if (!user.userId) {
    return { error: true as const, message: "Sign in to apply a discount code" };
  }

  const result = await validateDiscountCode({ ...params, userId: user.userId });
  if (!result.valid) {
    return { error: true as const, message: discountErrorMessage(result.reason) };
  }

  return { error: false as const, ...result };
}

function discountErrorMessage(reason: string) {
  switch (reason) {
    case "not_found":
      return "That code doesn't exist";
    case "disabled":
      return "That code is no longer active";
    case "expired":
      return "That code has expired";
    case "wrong_product":
      return "That code doesn't apply to this product";
    case "max_redemptions_reached":
      return "That code has reached its usage limit";
    case "user_limit_reached":
      return "You've already used this code";
    default:
      return "That code isn't valid";
  }
}
