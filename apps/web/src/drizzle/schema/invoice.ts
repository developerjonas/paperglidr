import {
  pgTable,
  text,
  integer,
  uuid,
  timestamp,
  pgEnum,
  jsonb,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createdAt, id } from "../schemaHelpers";
import { PurchaseTable } from "./purchase";
import { UserTable } from "./user";

export const invoiceStatuses = ["issued", "void"] as const;
export type InvoiceStatus = (typeof invoiceStatuses)[number];
export const invoiceStatusEnum = pgEnum("invoice_status", invoiceStatuses);

export const InvoiceTable = pgTable("invoices", {
  id: id(),
  // e.g. "INV-2082-83-000045" — human-facing, sequential, never reused
  invoiceNumber: text().notNull().unique(),
  fiscalYear: text().notNull(),
  purchaseId: uuid()
    .notNull()
    .unique() // one invoice per purchase, always — refunds get a credit note, not a second invoice
    .references(() => PurchaseTable.id, { onDelete: "restrict" }),
  buyerUserId: uuid()
    .notNull()
    .references(() => UserTable.id, { onDelete: "restrict" }),
  // Snapshot at issue time — same reasoning as Purchase.productDetails.
  // A buyer's name/email changing later must never alter an issued invoice.
  buyerName: text().notNull(),
  buyerEmail: text().notNull(),
  buyerPan: text(), // nullable — not collected yet, field exists so CBMS-readiness doesn't need a schema change later
  sellerName: text().notNull(),
  sellerPan: text(), // nullable until you have one
  lineItems: jsonb()
    .notNull()
    .$type<{ description: string; amountPaisa: number }[]>(),
  subtotalPaisa: integer().notNull(),
  vatRatePercent: integer(), // nullable — null means "not VAT-registered yet", not "0% VAT"
  vatAmountPaisa: integer(), // nullable, same reasoning
  totalPaisa: integer().notNull(),
  status: invoiceStatusEnum().notNull().default("issued"),
  pdfR2Key: text(), // nullable until the PDF job succeeds
  emailedAt: timestamp({ withTimezone: true }),
  createdAt,
});

// Atomic per-fiscal-year counter — avoids gaps/races that a
// SELECT COUNT(*) + 1 approach would be vulnerable to under concurrency.
export const InvoiceSequenceTable = pgTable("invoice_sequences", {
  fiscalYear: text().primaryKey(),
  lastNumber: integer().notNull().default(0),
});

export const InvoiceRelationships = relations(InvoiceTable, ({ one }) => ({
  purchase: one(PurchaseTable, {
    fields: [InvoiceTable.purchaseId],
    references: [PurchaseTable.id],
  }),
  buyer: one(UserTable, {
    fields: [InvoiceTable.buyerUserId],
    references: [UserTable.id],
  }),
}));
