import {
  pgTable,
  integer,
  jsonb,
  uuid,
  text,
  timestamp,
  pgEnum,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { createdAt, id, updatedAt } from "../schemaHelpers";
import { relations } from "drizzle-orm";
import { UserTable } from "./user";
import { ProductTable } from "./product";

// Extensible — add "bank" or a new gateway later without touching existing rows
export const purchaseGateways = [
  "esewa",
  "khalti",
  "fonepay",
  "bank",
  "free",
] as const;
export type PurchaseGateway = (typeof purchaseGateways)[number];
export const purchaseGatewayEnum = pgEnum("purchase_gateway", purchaseGateways);

export const purchaseStatuses = [
  "pending",
  "completed",
  "failed",
  "refunded",
  "disputed",
] as const;
export type PurchaseStatus = (typeof purchaseStatuses)[number];
export const purchaseStatusEnum = pgEnum("purchase_status", purchaseStatuses);

export const PurchaseTable = pgTable(
  "purchases",
  {
    id,

    // Renamed from pricePaidInCents — NPR's subunit is paisa, same concept as cents.
    // Flagging this as a breaking rename; see note below.
    pricePaidInPaisa: integer().notNull(),

    productDetails: jsonb()
      .notNull()
      .$type<{ name: string; description: string; imageUrl: string }>(),

    userId: uuid()
      .notNull()
      .references(() => UserTable.id, { onDelete: "restrict" }),
    productId: uuid()
      .notNull()
      .references(() => ProductTable.id, { onDelete: "restrict" }),

    gateway: purchaseGatewayEnum().notNull(),
    status: purchaseStatusEnum().notNull().default("pending"),

    // The reference YOU generate and send to the gateway at checkout initiation
    // (order id / merchant reference). Yours to control, always present.
    gatewayCheckoutId: text().notNull(),

    // The reference THEY return once payment is attempted/completed.
    // Nullable — doesn't exist until the gateway calls back. This is what you
    // use to call their server-to-server verify/status API — never trust
    // client-redirect params alone.
    gatewayTransactionId: text(),

    // Raw callback/webhook payload, stored as-is. When eSewa or Khalti's API
    // changes a field name or you need to debug a disputed payment six months
    // from now, this is the only source of truth you'll actually have.
    rawGatewayResponse: jsonb(),

    // Only meaningful for QR-based gateways (Fonepay) where the customer
    // has a limited window to scan and pay before the QR goes stale.
    // Null for redirect-based gateways where the provider owns the timeout.
    expiresAt: timestamp({ withTimezone: true }),

    // Prevents a double-click or a retried request from creating two purchase
    // rows for the same checkout attempt before the gateway even responds.
    idempotencyKey: text().notNull().unique(),

    refundedAt: timestamp({ withTimezone: true }),
    refundReason: text(),

    createdAt,
    updatedAt,
  },
  (t) => [
    // A gateway will never send the same transaction id twice for two different
    // purchases — this stops a replayed/duplicated webhook from double-crediting
    // course access or double-writing a ledger entry.
    uniqueIndex("gateway_transaction_unique_idx").on(
      t.gateway,
      t.gatewayTransactionId,
    ),
  ],
);

export const PurchaseRelationships = relations(PurchaseTable, ({ one }) => ({
  user: one(UserTable, {
    fields: [PurchaseTable.userId],
    references: [UserTable.id],
  }),
  product: one(ProductTable, {
    fields: [PurchaseTable.productId],
    references: [ProductTable.id],
  }),
}));
