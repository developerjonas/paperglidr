import { db } from "@/drizzle/db";
import { PurchaseTable } from "@/drizzle/schema";
import { revalidatePurchaseCache } from "./cache";
import { and, eq, inArray } from "drizzle-orm";
import { desc } from "drizzle-orm"

export async function insertPurchase(
  data: typeof PurchaseTable.$inferInsert,
  trx: Omit<typeof db, "$client"> = db,
) {
  const details = data.productDetails;
  const [newPurchase] = await trx
    .insert(PurchaseTable)
    .values({
      ...data,
      productDetails: {
        name: details.name,
        description: details.description,
        imageUrl: details.imageUrl,
      },
    })
    // Target idempotencyKey explicitly. On insert, gatewayTransactionId is
    // always null (the gateway hasn't responded yet), so an untargeted
    // onConflictDoNothing() would also silently swallow a genuine bug —
    // e.g. two null gatewayTransactionIds colliding under the composite
    // index in a way you didn't intend. Naming the target means a conflict
    // ONLY means "this exact checkout attempt was already inserted," which
    // is the one case you actually want to no-op on.
    .onConflictDoNothing({ target: PurchaseTable.idempotencyKey })
    .returning();

  if (newPurchase != null) revalidatePurchaseCache(newPurchase);
  return newPurchase;
}

export async function updatePurchase(
  id: string,
  data: Partial<typeof PurchaseTable.$inferInsert>,
  trx: Omit<typeof db, "$client"> = db,
) {
  const details = data.productDetails;
  const [updatedPurchase] = await trx
    .update(PurchaseTable)
    .set({
      ...data,
      productDetails: details
        ? {
            name: details.name,
            description: details.description,
            imageUrl: details.imageUrl,
          }
        : undefined,
    })
    .where(eq(PurchaseTable.id, id))
    .returning();
  if (updatedPurchase == null) throw new Error("Failed to update purchase");
  revalidatePurchaseCache(updatedPurchase);
  return updatedPurchase;
}

export async function getPurchaseByIdempotencyKey(
  idempotencyKey: string,
  trx: Omit<typeof db, "$client"> = db,
) {
  return trx.query.PurchaseTable.findFirst({
    where: eq(PurchaseTable.idempotencyKey, idempotencyKey),
  });
}

export async function getPurchaseByGatewayTransaction(
  {
    gateway,
    gatewayTransactionId,
  }: {
    gateway: (typeof PurchaseTable.$inferSelect)["gateway"];
    gatewayTransactionId: string;
  },
  trx: Omit<typeof db, "$client"> = db,
) {
  return trx.query.PurchaseTable.findFirst({
    where: and(
      eq(PurchaseTable.gateway, gateway),
      eq(PurchaseTable.gatewayTransactionId, gatewayTransactionId),
    ),
  });
}

/**
 * Atomically transitions a purchase from pending to completed. The
 * status guard in the WHERE clause is the important part — it's what makes
 * a duplicate return/poll/cron call a no-op instead of a double
 * completion. Two concurrent calls for the same purchase race on this
 * UPDATE; Postgres row-locks it, the second re-evaluates the WHERE after
 * the first commits, finds status = "completed", and affects no row — so
 * course access and ledger entries are never written twice.
 */
export async function markPurchaseCompleted(
  {
    id,
    gatewayTransactionId,
    rawGatewayResponse,
  }: {
    id: string;
    // null when the gateway reports no separate transaction reference —
    // never "": the (gateway, gatewayTransactionId) unique index would make
    // two such completions collide.
    gatewayTransactionId: string | null;
    rawGatewayResponse: unknown;
  },
  trx: Omit<typeof db, "$client"> = db,
) {
  const [updatedPurchase] = await trx
    .update(PurchaseTable)
    .set({
      status: "completed",
      gatewayTransactionId,
      rawGatewayResponse,
    })
    // "failed" too: late success wins — if the gateway later confirms a
    // payment we'd given up on, the buyer still gets what they paid for.
    .where(and(eq(PurchaseTable.id, id), inArray(PurchaseTable.status, ["pending", "failed"])))
    .returning();

  // undefined means either the purchase doesn't exist, or it was already
  // completed by a concurrent/duplicate call — both are "nothing to do".
  return updatedPurchase;
}

/**
 * The gateway confirmed a payment that doesn't match this purchase (wrong
 * amount, or a transaction reference already used by another purchase).
 * Terminal for automated flows: an admin decides. Never grants access.
 */
export async function markPurchaseDisputed(
  { id, rawGatewayResponse }: { id: string; rawGatewayResponse: unknown },
  trx: Omit<typeof db, "$client"> = db,
) {
  const [updatedPurchase] = await trx
    .update(PurchaseTable)
    .set({ status: "disputed", rawGatewayResponse })
    .where(and(eq(PurchaseTable.id, id), inArray(PurchaseTable.status, ["pending", "failed"])))
    .returning();
  return updatedPurchase;
}

/**
 * Terminal failure reported by the gateway (cancelled, expired, refunded,
 * or no record after the grace period), or given up on by the cron. Only
 * moves a PENDING purchase — never touches completed/disputed/refunded.
 */
export async function markPurchaseFailed(
  { id, rawGatewayResponse }: { id: string; rawGatewayResponse?: unknown },
  trx: Omit<typeof db, "$client"> = db,
) {
  const [updatedPurchase] = await trx
    .update(PurchaseTable)
    .set({
      status: "failed",
      ...(rawGatewayResponse !== undefined ? { rawGatewayResponse } : {}),
    })
    .where(and(eq(PurchaseTable.id, id), eq(PurchaseTable.status, "pending")))
    .returning();
  return updatedPurchase;
}

/**
 * All purchases for the signed-in user, newest first — powers the
 * mobile "My Purchases" list. Read-only; checkout stays web-only for now.
 */
export async function getPurchasesForUser(
  userId: string,
  trx: Omit<typeof db, "$client"> = db,
) {
  return trx.query.PurchaseTable.findMany({
    where: eq(PurchaseTable.userId, userId), // TODO: verify column name
    orderBy: desc(PurchaseTable.createdAt),
  })
}
