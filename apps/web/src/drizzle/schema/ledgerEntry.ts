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

export const revenueSourceTypes = ["instructor_link", "platform"] as const;
export type RevenueSourceType = (typeof revenueSourceTypes)[number];
export const revenueSourceEnum = pgEnum("revenue_source", revenueSourceTypes);

export const LedgerEntryTable = pgTable(
  "ledger_entries",
  {
    id: id(),
    purchaseId: uuid().notNull().references(() => PurchaseTable.id, { onDelete: "restrict" }),
    courseId: uuid().notNull().references(() => CourseTable.id, { onDelete: "restrict" }),
    instructorId: uuid().notNull().references(() => UserTable.id, { onDelete: "restrict" }),
    entryType: ledgerEntryTypeEnum().notNull().default("sale"),
    // Which rate bucket applied to this sale — kept even if the default
    // rates change later, so historical entries never silently recompute.
    revenueSource: revenueSourceEnum().notNull(),
    platformFeeRateBps: integer().notNull(), // 3000 = 30%, 5000 = 50%
    grossAmountPaisa: integer().notNull(),
    platformFeePaisa: integer().notNull(),
    creatorEarningsPaisa: integer().notNull(),
    createdAt,
  },
  (t) => [
    uniqueIndex("purchase_course_entry_type_unique_idx").on(
      t.purchaseId, t.courseId, t.entryType,
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
