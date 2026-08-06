import { pgTable, integer, uuid } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createdAt, id } from "../schemaHelpers";
import { PurchaseTable } from "./purchase";
import { CourseTable } from "./course";
import { UserTable } from "./user";

// No updatedAt on purpose — ledger entries are append-only. A correction
// should be a new reversing entry, never an edit to history you'd have to
// explain in an audit.
export const LedgerEntryTable = pgTable("ledger_entries", {
  id,
  purchaseId: uuid()
    .notNull()
    .unique() // enforces exactly one ledger entry per purchase at the DB level
    .references(() => PurchaseTable.id, { onDelete: "restrict" }),
  courseId: uuid()
    .notNull()
    .references(() => CourseTable.id, { onDelete: "restrict" }),
  instructorId: uuid()
    .notNull()
    .references(() => UserTable.id, { onDelete: "restrict" }),

  grossAmountPaisa: integer().notNull(),
  platformFeePaisa: integer().notNull(),
  creatorEarningsPaisa: integer().notNull(), // gross - fee, frozen at write time

  createdAt,
});

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
