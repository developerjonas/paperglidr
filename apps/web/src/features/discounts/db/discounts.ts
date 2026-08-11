import { db } from "@/drizzle/db";
import { DiscountCodeTable } from "@/drizzle/schema/discountCode";
import { DiscountRedemptionTable } from "@/drizzle/schema/discountRedemption";
import { and, eq, sql } from "drizzle-orm";
import { DiscountCodeFormValues } from "../schemas/discounts";

export async function insertDiscountCode(
  data: DiscountCodeFormValues & { creatorId: string },
) {
  const [discountCode] = await db
    .insert(DiscountCodeTable)
    .values(data)
    .returning();
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
  return discountCode;
}

export async function deleteDiscountCode(id: string) {
  await db.delete(DiscountCodeTable).where(eq(DiscountCodeTable.id, id));
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

// Records a redemption and bumps the running counter atomically. Call this
// ONLY after validateDiscountCode has confirmed eligibility, and inside the
// same transaction that creates the Purchase row — otherwise two
// simultaneous checkouts can both slip in under maxRedemptions.
export async function recordDiscountRedemption(params: {
  discountCodeId: string;
  userId: string;
  purchaseId: string;
  amountDiscountedInRupees: number;
}) {
  await db.transaction(async (tx) => {
    await tx.insert(DiscountRedemptionTable).values(params);
    await tx
      .update(DiscountCodeTable)
      .set({ redemptionCount: sql`${DiscountCodeTable.redemptionCount} + 1` })
      .where(eq(DiscountCodeTable.id, params.discountCodeId));
  });
}
