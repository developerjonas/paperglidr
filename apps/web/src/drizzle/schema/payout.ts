import {
  pgTable,
  integer,
  uuid,
  text,
  timestamp,
  pgEnum,
  jsonb,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createdAt, id, updatedAt } from "../schemaHelpers";
import { UserTable } from "./user";

export const payoutStatuses = ["requested", "paid", "rejected"] as const;
export type PayoutStatus = (typeof payoutStatuses)[number];
export const payoutStatusEnum = pgEnum("payout_status", payoutStatuses);

export const payoutMethods = ["bank", "esewa", "khalti"] as const;
export type PayoutMethod = (typeof payoutMethods)[number];
export const payoutMethodEnum = pgEnum("payout_method", payoutMethods);

// Structured destination, frozen at request time. Validated by
// features/payouts/schemas/payouts.ts before it's stored.
export type PayoutDetails =
  | {
      method: "bank";
      bankName: string;
      accountName: string;
      accountNumber: string;
      branch: string;
    }
  | { method: "esewa" | "khalti"; walletId: string; accountName: string };

export const PayoutTable = pgTable("payouts", {
  id: id(),
  instructorId: uuid()
    .notNull()
    .references(() => UserTable.id, { onDelete: "restrict" }),
  amountPaisa: integer().notNull(),
  status: payoutStatusEnum().notNull().default("requested"),

  // Frozen at request time — details can change later; this is what was
  // actually promised for THIS payout. bankDetailsSnapshot is the
  // human-readable form (also filled for requests made before the
  // structured fields existed, which have null method/details).
  bankDetailsSnapshot: text().notNull(),
  payoutMethod: payoutMethodEnum("payout_method"),
  payoutDetails: jsonb("payout_details").$type<PayoutDetails>(),

  paidAt: timestamp({ withTimezone: true }),
  rejectedReason: text(),

  createdAt,
  updatedAt,
});

export const PayoutRelationships = relations(PayoutTable, ({ one }) => ({
  instructor: one(UserTable, {
    fields: [PayoutTable.instructorId],
    references: [UserTable.id],
  }),
}));
