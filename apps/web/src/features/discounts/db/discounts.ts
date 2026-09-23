import { db } from "@/drizzle/db";
import { DiscountCodeTable } from "@/drizzle/schema/discountCode";
import { DiscountRedemptionTable } from "@/drizzle/schema/discountRedemption";
import { and, eq, sql } from "drizzle-orm";
import { DiscountCodeFormValues } from "../schemas/discounts";
import { revalidateDiscountCodeCache } from "./cache";
import { UserFacingError } from "@/lib/safeError";

export async function insertDiscountCode(
  data: DiscountCodeFormValues & { creatorId: string },
) {
  const [discountCode] = await db
    .insert(DiscountCodeTable)
    .values(data)
    .returning();
  if (discountCode != null)
    revalidateDiscountCodeCache(discountCode.id, discountCode.creatorId);
  return discountCode;
}

export async function updateDiscountCode(
  id: string,
  data: Partial<DiscountCodeFormValues>,
) {
  const [discountCode] = await db
    .update(DiscountCodeTable)
    .set(data)
    .where(eq(DiscountCodeTable.id, id))
    .returning();
  if (discountCode != null)
    revalidateDiscountCodeCache(discountCode.id, discountCode.creatorId);
  return discountCode;
}

export async function deleteDiscountCode(id: string) {
  const [discountCode] = await db
    .delete(DiscountCodeTable)
    .where(eq(DiscountCodeTable.id, id))
    .returning();
  if (discountCode != null)
    revalidateDiscountCodeCache(discountCode.id, discountCode.creatorId);
}

export async function getDiscountCodesForCreator(creatorId: string) {
  return db.query.DiscountCodeTable.findMany({
    where: eq(DiscountCodeTable.creatorId, creatorId),
    with: { product: true },
    orderBy: (table, { desc }) => desc(table.createdAt),
  });
}

export async function getDiscountCodeByCode(code: string) {
  return db.query.DiscountCodeTable.findFirst({
    where: eq(DiscountCodeTable.code, code.toUpperCase()),
    with: { product: true },
  });
}

export async function getUserRedemptionCount(
  discountCodeId: string,
  userId: string,
) {
  const [row] = await db
    .select({ count: sql<number>`count(*)`.mapWith(Number) })
    .from(DiscountRedemptionTable)
    .where(
      and(
        eq(DiscountRedemptionTable.discountCodeId, discountCodeId),
        eq(DiscountRedemptionTable.userId, userId),
      ),
    );
  return row?.count ?? 0;
}

/**
 * Records a redemption and bumps the running counter. Takes an optional
 * `trx` (same convention as features/purchases/db/purchases.ts) so
 * confirmPurchase can call this inside its own transaction — redemption
 * must commit atomically with purchase completion, or a rolled-back
 * purchase could still burn a use of the code.
 */
/**
 * For redemptions that grant access by themselves (a 100%-discount free
 * enrollment): locks the code row and re-checks its limits inside the
 * caller's transaction, so concurrent checkouts can't all slip past the
 * check done at checkout time. Call it FIRST in the transaction — before
 * inserting anything that references the code — or the FK's key-share lock
 * taken by that insert deadlocks against this row lock.
 */
export async function lockAndCheckDiscountLimits(
  { discountCodeId, userId }: { discountCodeId: string; userId: string },
  trx: Omit<typeof db, "$client">,
) {
  const [code] = await trx
    .select({
      status: DiscountCodeTable.status,
      redemptionCount: DiscountCodeTable.redemptionCount,
      maxRedemptions: DiscountCodeTable.maxRedemptions,
      maxRedemptionsPerUser: DiscountCodeTable.maxRedemptionsPerUser,
    })
    .from(DiscountCodeTable)
    .where(eq(DiscountCodeTable.id, discountCodeId))
    .for("update");
  const [userRedemptions] = await trx
    .select({ count: sql<number>`count(*)`.mapWith(Number) })
    .from(DiscountRedemptionTable)
    .where(
      and(
        eq(DiscountRedemptionTable.discountCodeId, discountCodeId),
        eq(DiscountRedemptionTable.userId, userId),
      ),
    );
  if (
    code == null ||
    code.status !== "active" ||
    (code.maxRedemptions != null && code.redemptionCount >= code.maxRedemptions) ||
    (userRedemptions?.count ?? 0) >= code.maxRedemptionsPerUser
  ) {
    throw new UserFacingError("That code has reached its usage limit.");
  }
}

export async function recordDiscountRedemption(
  params: {
    discountCodeId: string;
    userId: string;
    purchaseId: string;
    amountDiscountedInPaisa: number;
  },
  trx: Omit<typeof db, "$client"> = db,
) {
  await trx.insert(DiscountRedemptionTable).values(params);
  await trx
    .update(DiscountCodeTable)
    .set({ redemptionCount: sql`${DiscountCodeTable.redemptionCount} + 1` })
    .where(eq(DiscountCodeTable.id, params.discountCodeId));
}
