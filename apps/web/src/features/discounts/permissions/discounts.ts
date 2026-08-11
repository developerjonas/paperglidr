import { db } from "@/drizzle/db";
import { DiscountCodeTable } from "@/drizzle/schema/discountCode";
import { eq } from "drizzle-orm";

type UserContext = { userId: string | undefined; role: string | undefined };

// ADJUST: I don't have your UserRole enum values for the creator role —
// swap "instructor" for whatever it actually is (checked against your
// general.ts's canAccessAdminPages, which only knows about "admin").
export function canCreateDiscountCodes(user: UserContext) {
  return !!user.userId && (user.role === "instructor" || user.role === "admin");
}

export async function canUpdateDiscountCodes(
  user: UserContext,
  discountCodeId: string,
) {
  if (!user.userId) return false;
  if (user.role === "admin") return true;

  const discountCode = await db.query.DiscountCodeTable.findFirst({
    where: eq(DiscountCodeTable.id, discountCodeId),
  });
  if (!discountCode) return false;

  return discountCode.creatorId === user.userId;
}

export const canDeleteDiscountCodes = canUpdateDiscountCodes;
