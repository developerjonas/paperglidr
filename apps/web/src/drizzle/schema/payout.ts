import {
  pgTable,
  integer,
  uuid,
  text,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createdAt, id, updatedAt } from "../schemaHelpers";
import { UserTable } from "./user";

export const payoutStatuses = ["requested", "paid", "rejected"] as const;
export type PayoutStatus = (typeof payoutStatuses)[number];
export const payoutStatusEnum = pgEnum("payout_status", payoutStatuses);

export const PayoutTable = pgTable("payouts", {
  id,
  instructorId: uuid()
    .notNull()
    .references(() => UserTable.id, { onDelete: "restrict" }),
  amountPaisa: integer().notNull(),
  status: payoutStatusEnum().notNull().default("requested"),

  // Frozen at request time — bank details can change later; this is what
  // was actually promised for THIS payout
  bankDetailsSnapshot: text().notNull(),

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
