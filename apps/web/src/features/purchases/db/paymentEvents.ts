import { db } from "@/drizzle/db";
import {
  PaymentEventTable,
  type PaymentEventOutcome,
  type PaymentEventSource,
} from "@/drizzle/schema";

/**
 * Append one entry to the payment event log. Never throws: a logging
 * failure must not turn a successful fulfilment into an error.
 */
export async function recordPaymentEvent(event: {
  purchaseId: string;
  source: PaymentEventSource;
  gateway: string;
  outcome: PaymentEventOutcome;
  gatewayStatus?: string | null;
  amountInPaisa?: number | null;
  detail?: unknown;
}) {
  try {
    await db.insert(PaymentEventTable).values({
      purchaseId: event.purchaseId,
      source: event.source,
      gateway: event.gateway,
      outcome: event.outcome,
      gatewayStatus: event.gatewayStatus ?? null,
      amountInPaisa: event.amountInPaisa ?? null,
      detail: event.detail ?? null,
    });
  } catch (error) {
    console.error(`[payments] failed to record ${event.outcome} event for ${event.purchaseId}`, error);
  }
}

export async function getPaymentEventsForPurchase(purchaseId: string) {
  return db.query.PaymentEventTable.findMany({
    where: (events, { eq }) => eq(events.purchaseId, purchaseId),
    orderBy: (events, { desc }) => desc(events.createdAt),
  });
}
