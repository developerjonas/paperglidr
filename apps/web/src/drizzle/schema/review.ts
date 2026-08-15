import {
  pgTable,
  text,
  integer,
  uuid,
  boolean,
  timestamp,
  index,
  unique,
} from "drizzle-orm/pg-core";
import { id, createdAt, updatedAt } from "../schemaHelpers";
import { UserTable } from "./user";
import { CourseTable } from "./course";
import { relations } from "drizzle-orm";

export const CourseReviewTable = pgTable(
  "course_reviews",
  {
    id: id(),
    rating: integer("rating").notNull(),
    content: text("content"),
    userId: uuid("user_id")
      .notNull()
      .references(() => UserTable.id, { onDelete: "cascade" }),
    courseId: uuid("course_id")
      .notNull()
      .references(() => CourseTable.id, { onDelete: "cascade" }),
    isHidden: boolean("is_hidden").notNull().default(false),
    instructorReply: text("instructor_reply"),
    instructorReplyAt: timestamp("instructor_reply_at", { withTimezone: true }),
    createdAt,
    updatedAt,
  },
  (t) => [
    unique("course_reviews_user_id_course_id_unique").on(t.userId, t.courseId),
    index("course_reviews_course_id_idx").on(t.courseId),
  ],
);

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
