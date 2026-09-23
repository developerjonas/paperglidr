import { relations } from "drizzle-orm";
import {
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  uuid,
} from "drizzle-orm/pg-core";
import { createdAt, id } from "../schemaHelpers";
import { PurchaseTable } from "./purchase";

// Who triggered the verification.
export const paymentEventSources = [
  "initiate",
  "return",
  "poll",
  "success_page",
  "cron",
  "admin",
] as const;
export type PaymentEventSource = (typeof paymentEventSources)[number];
export const paymentEventSourceEnum = pgEnum(
  "payment_event_source",
  paymentEventSources,
);

// What it concluded. "error" = no usable answer from the gateway (nothing
// changed); "expired" = the cron gave up on a purchase pending > 48h.
export const paymentEventOutcomes = [
  "initiated",
  "completed",
  "already_completed",
  "pending",
  "failed",
  "disputed",
  "expired",
  "error",
] as const;
export type PaymentEventOutcome = (typeof paymentEventOutcomes)[number];
export const paymentEventOutcomeEnum = pgEnum(
  "payment_event_outcome",
  paymentEventOutcomes,
);

/**
 * Append-only log of every conversation with a payment gateway about a
 * purchase — the record you need for "I paid but got nothing" tickets and
 * disputes. Never updated or deleted.
 */
export const PaymentEventTable = pgTable(
  "payment_events",
  {
    id: id(),
    purchaseId: uuid()
      .notNull()
      .references(() => PurchaseTable.id, { onDelete: "restrict" }),
    source: paymentEventSourceEnum().notNull(),
    gateway: text().notNull(),
    outcome: paymentEventOutcomeEnum().notNull(),
    // The gateway's own status string, verbatim (e.g. "COMPLETE", "User canceled")
    gatewayStatus: text(),
    // Amount the gateway reported, in paisa (null when it reported none)
    amountInPaisa: integer(),
    detail: jsonb(),
    createdAt,
  },
  t => [index("payment_events_purchase_id_idx").on(t.purchaseId)],
);

export const PaymentEventRelationships = relations(
  PaymentEventTable,
  ({ one }) => ({
    purchase: one(PurchaseTable, {
      fields: [PaymentEventTable.purchaseId],
      references: [PurchaseTable.id],
    }),
  }),
);
