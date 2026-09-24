import { pgTable, uuid, text, pgEnum, integer, boolean, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { createdAt, updatedAt } from "../schemaHelpers";
import { relations, sql } from "drizzle-orm";
import { UserTable } from "./user";
import { CourseTable } from "./course";
import { PurchaseTable } from "./purchase";

export const refundRequestStatuses = [
  "pending",
  "approved",
  "denied",
  "processed",
] as const;
export const refundRequestStatusEnum = pgEnum(
  "refund_request_status",
  refundRequestStatuses,
);

export const RefundRequestTable = pgTable("refund_requests", {
  id: uuid().primaryKey().defaultRandom(),
  purchaseId: uuid()
    .notNull()
    .references(() => PurchaseTable.id, { onDelete: "cascade" }),
  userId: uuid()
    .notNull()
    .references(() => UserTable.id, { onDelete: "cascade" }),
  // The purchase's first course (by id). A bundle has several; eligibility
  // is computed across all of them, and the admin page shows the product
  // from the purchase. Kept for "refund requests per course" lookups.
  courseId: uuid()
    .notNull()
    .references(() => CourseTable.id, { onDelete: "cascade" }),
  reason: text(),
  // Snapshot at the moment of request. If the student completes more
  // lessons afterward (or an admin edits the course length later), that
  // must NOT change what the eligibility check said at request time.
  completionPercentAtRequest: integer().notNull(),
  withinWindowAtRequest: boolean().notNull(),
  eligible: boolean().notNull(),
  status: refundRequestStatusEnum().notNull().default("pending"),
  reviewedBy: uuid().references(() => UserTable.id, { onDelete: "set null" }),
  reviewedAt: timestamp({ withTimezone: true }),
  adminNote: text(),
  createdAt,
  updatedAt,
}, table => [
  // One open request per purchase, so a purchase can't be refunded twice
  // through two requests. A denied request doesn't count.
  uniqueIndex("refund_requests_open_purchase_idx")
    .on(table.purchaseId)
    .where(sql`${table.status} in ('pending', 'approved', 'processed')`),
]);

export const RefundRequestRelationships = relations(
  RefundRequestTable,
  ({ one }) => ({
    purchase: one(PurchaseTable, {
      fields: [RefundRequestTable.purchaseId],
      references: [PurchaseTable.id],
    }),
    user: one(UserTable, {
      fields: [RefundRequestTable.userId],
      references: [UserTable.id],
    }),
    course: one(CourseTable, {
      fields: [RefundRequestTable.courseId],
      references: [CourseTable.id],
    }),
    reviewer: one(UserTable, {
      fields: [RefundRequestTable.reviewedBy],
      references: [UserTable.id],
    }),
  }),
);
