import "server-only";
import { and, asc, eq, gt, inArray, lt } from "drizzle-orm";
import { db } from "@/drizzle/db";
import { PurchaseTable } from "@/drizzle/schema";
import { GATEWAY_NAMES } from "@/services/payments/config";
import { revalidatePurchaseCache } from "../db/cache";
import { recordPaymentEvent } from "../db/paymentEvents";
import { markPurchaseFailed } from "../db/purchases";
import {
  defaultFulfilDeps,
  verifyAndFulfil,
  type FulfilDeps,
  type FulfilOutcome,
} from "./verifyAndFulfil";

// Leave the buyer time to come back through the return route first.
export const RECONCILE_MIN_AGE_MS = 2 * 60 * 1000;
// A payment still unresolved after this long is given up on (-> failed).
export const PENDING_EXPIRY_MS = 48 * 60 * 60 * 1000;
// Recently failed purchases are re-checked this long: late success wins.
export const FAILED_RECHECK_WINDOW_MS = 24 * 60 * 60 * 1000;

const CONCURRENCY = 5;

export type ReconcileSummary = {
  checked: number;
  outcomes: Partial<Record<FulfilOutcome | "expired", number>>;
};

/**
 * The webhook substitute: asks each gateway about purchases the buyer's
 * browser never came back for. Safe to run concurrently with return
 * routes, polls and itself — verifyAndFulfil fulfils exactly once.
 */
export async function reconcilePayments({
  now = new Date(),
  limit = 50,
  deps = defaultFulfilDeps,
}: { now?: Date; limit?: number; deps?: FulfilDeps } = {}): Promise<ReconcileSummary> {
  const paidGateways = [...GATEWAY_NAMES];

  const pending = await db
    .select({ id: PurchaseTable.id, createdAt: PurchaseTable.createdAt })
    .from(PurchaseTable)
    .where(
      and(
        eq(PurchaseTable.status, "pending"),
        inArray(PurchaseTable.gateway, paidGateways),
        lt(PurchaseTable.createdAt, new Date(now.getTime() - RECONCILE_MIN_AGE_MS)),
      ),
    )
    .orderBy(asc(PurchaseTable.createdAt))
    .limit(limit);

  const failed =
    pending.length < limit
      ? await db
          .select({ id: PurchaseTable.id, createdAt: PurchaseTable.createdAt })
          .from(PurchaseTable)
          .where(
            and(
              eq(PurchaseTable.status, "failed"),
              inArray(PurchaseTable.gateway, paidGateways),
              gt(PurchaseTable.createdAt, new Date(now.getTime() - FAILED_RECHECK_WINDOW_MS)),
            ),
          )
          .orderBy(asc(PurchaseTable.createdAt))
          .limit(limit - pending.length)
      : [];

  const queue = [...pending, ...failed];
  const summary: ReconcileSummary = { checked: queue.length, outcomes: {} };
  const count = (outcome: FulfilOutcome | "expired") => {
    summary.outcomes[outcome] = (summary.outcomes[outcome] ?? 0) + 1;
  };

  async function reconcileOne({ id, createdAt }: { id: string; createdAt: Date }) {
    const result = await verifyAndFulfil(id, "cron", deps);
    const expired =
      result.outcome === "pending" &&
      now.getTime() - createdAt.getTime() > PENDING_EXPIRY_MS;
    if (!expired) return count(result.outcome);

    const updated = await markPurchaseFailed({ id });
    if (updated == null) return count(result.outcome); // changed meanwhile
    revalidatePurchaseCache(updated);
    await recordPaymentEvent({
      purchaseId: id,
      source: "cron",
      gateway: updated.gateway,
      outcome: "expired",
      detail: { reason: "pending for more than 48 hours" },
    });
    count("expired");
  }

  // Bounded concurrency: the whole batch must fit in one function run.
  for (let i = 0; i < queue.length; i += CONCURRENCY) {
    await Promise.all(
      queue.slice(i, i + CONCURRENCY).map(item =>
        reconcileOne(item).catch(error => {
          console.error(`[payments] cron: reconcile failed for ${item.id}`, error);
          count("error");
        }),
      ),
    );
  }

  return summary;
}
