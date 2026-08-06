import {
  pgTable,
  integer,
  uuid,
  uniqueIndex,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createdAt, id } from "../schemaHelpers";
import { PurchaseTable } from "./purchase";
import { CourseTable } from "./course";
import { UserTable } from "./user";

export const ledgerEntryTypes = ["sale", "refund"] as const;
export type LedgerEntryType = (typeof ledgerEntryTypes)[number];
export const ledgerEntryTypeEnum = pgEnum(
  "ledger_entry_type",
  ledgerEntryTypes,
);

export const LedgerEntryTable = pgTable(
  "ledger_entries",
  {
    id,
    purchaseId: uuid()
      .notNull()
      .references(() => PurchaseTable.id, { onDelete: "restrict" }),
    courseId: uuid()
      .notNull()
      .references(() => CourseTable.id, { onDelete: "restrict" }),
    instructorId: uuid()
      .notNull()
      .references(() => UserTable.id, { onDelete: "restrict" }),

    entryType: ledgerEntryTypeEnum().notNull().default("sale"),

    // For a "sale" entry these are positive. For a "refund" entry these are
    // the SAME magnitude but negative — summing all entries for an
    // instructor gives their true net balance without ever editing history.
    grossAmountPaisa: integer().notNull(),
    platformFeePaisa: integer().notNull(),
    creatorEarningsPaisa: integer().notNull(),

    createdAt,
  },
  (t) => [
    // Was unique on purchaseId alone — that blocked a refund's reversing
    // entry from ever being inserted. Now one "sale" and at most one
    // "refund" per (purchase, course) pair — still guards against
    // duplicate ledger writes, just no longer blocks refunds.
    uniqueIndex("purchase_course_entry_type_unique_idx").on(
      t.purchaseId,
      t.courseId,
      t.entryType,
    ),
  ],
);

export const LedgerEntryRelationships = relations(
  LedgerEntryTable,
  ({ one }) => ({
    purchase: one(PurchaseTable, {
      fields: [LedgerEntryTable.purchaseId],
      references: [PurchaseTable.id],
    }),
    course: one(CourseTable, {
      fields: [LedgerEntryTable.courseId],
      references: [CourseTable.id],
    }),
    instructor: one(UserTable, {
      fields: [LedgerEntryTable.instructorId],
      references: [UserTable.id],
    }),
  }),
);
