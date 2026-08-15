import { pgTable, uuid, text, pgEnum, timestamp } from "drizzle-orm/pg-core";
import { createdAt, updatedAt } from "../schemaHelpers";
import { relations } from "drizzle-orm";
import { UserTable } from "./user";
import { CourseTable } from "./course";
import { CourseReviewTable } from "./review";
import { CourseProductTable } from "./courseProduct";
import { UserCourseAccessTable } from "./userCourseAccess";
import { CourseSectionTable } from "./courseSection";

// Kept generic on purpose: today it's only used for courses, but "report the
// instructor" / "report a specific lesson" are one enum value away, no migration needed.
export const reportReasons = [
  "scam",
  "piracy",
  "misleading",
  "inappropriate",
  "other",
] as const;
export const reportReasonEnum = pgEnum("report_reason", reportReasons);

export const reportStatuses = [
  "pending",
  "reviewing",
  "dismissed",
  "action_taken",
] as const;
export const reportStatusEnum = pgEnum("report_status", reportStatuses);

export const reportTargetTypes = ["course", "instructor", "lesson"] as const;
export const reportTargetTypeEnum = pgEnum(
  "report_target_type",
  reportTargetTypes,
);

export const ReportTable = pgTable("reports", {
  id: uuid().primaryKey().defaultRandom(),
  reporterId: uuid()
    .notNull()
    .references(() => UserTable.id, { onDelete: "cascade" }),
  targetType: reportTargetTypeEnum().notNull().default("course"),
  targetId: uuid().notNull(),
  // Denormalized for now so "reports per course" and refund-eligibility
  // context checks stay a single indexed lookup instead of a join through
  // targetId. Fine while targetType is almost always "course".
  courseId: uuid().references(() => CourseTable.id, { onDelete: "cascade" }),
  reason: reportReasonEnum().notNull(),
  details: text(),
  status: reportStatusEnum().notNull().default("pending"),
  reviewedBy: uuid().references(() => UserTable.id, { onDelete: "set null" }),
  reviewedAt: timestamp({ withTimezone: true }),
  adminNote: text(),
  createdAt,
  updatedAt,
});

export const ReportRelationships = relations(ReportTable, ({ one }) => ({
  reporter: one(UserTable, {
    fields: [ReportTable.reporterId],
    references: [UserTable.id],
  }),
  course: one(CourseTable, {
    fields: [ReportTable.courseId],
    references: [CourseTable.id],
  }),
  reviewer: one(UserTable, {
    fields: [ReportTable.reviewedBy],
    references: [UserTable.id],
  }),
}));

export const CourseRelationships = relations(CourseTable, ({ one, many }) => ({
  author: one(UserTable, {
    fields: [CourseTable.authorId],
    references: [UserTable.id],
  }),
  courseProducts: many(CourseProductTable),
  userCourseAccesses: many(UserCourseAccessTable),
  courseSections: many(CourseSectionTable),
  courseReviews: many(CourseReviewTable),
}));

export const CourseReviewRelationships = relations(
  CourseReviewTable,
  ({ one }) => ({
    course: one(CourseTable, {
      fields: [CourseReviewTable.courseId],
      references: [CourseTable.id],
    }),
    user: one(UserTable, {
      fields: [CourseReviewTable.userId],
      references: [UserTable.id],
    }),
  }),
);
