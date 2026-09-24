import { pgTable, uuid, text, pgEnum, integer, boolean, timestamp, uniqueIndex, primaryKey, index } from "drizzle-orm/pg-core";
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
  // The purchase's first course (by id), kept for existing queries. The
  // full list — every course of a bundle — is in refund_request_courses.
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
  // "Mark money returned" on /admin/refunds: the admin who refunded the
  // money in the gateway dashboard, and when (status approved -> processed).
  processedBy: uuid("processed_by").references(() => UserTable.id, { onDelete: "set null" }),
  processedAt: timestamp("processed_at", { withTimezone: true }),
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
  ({ one, many }) => ({
    courses: many(RefundRequestCourseTable),
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
    processor: one(UserTable, {
      fields: [RefundRequestTable.processedBy],
      references: [UserTable.id],
    }),
  }),
);

/**
 * Every course a refund request covers: one row for a single course, one
 * per course for a bundle (the courses in the product when the refund was
 * requested). Completion for eligibility is measured across all of them.
 */
export const RefundRequestCourseTable = pgTable(
  "refund_request_courses",
  {
    refundRequestId: uuid("refund_request_id")
      .notNull()
      .references(() => RefundRequestTable.id, { onDelete: "cascade" }),
    courseId: uuid("course_id")
      .notNull()
      .references(() => CourseTable.id, { onDelete: "cascade" }),
  },
  table => [
    primaryKey({ columns: [table.refundRequestId, table.courseId] }),
    index("refund_request_courses_course_idx").on(table.courseId),
  ],
);

export const RefundRequestCourseRelationships = relations(
  RefundRequestCourseTable,
  ({ one }) => ({
    refundRequest: one(RefundRequestTable, {
      fields: [RefundRequestCourseTable.refundRequestId],
      references: [RefundRequestTable.id],
    }),
    course: one(CourseTable, {
      fields: [RefundRequestCourseTable.courseId],
      references: [CourseTable.id],
    }),
  }),
);
