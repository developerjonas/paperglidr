import {
  pgTable,
  text,
  integer,
  uuid,
  boolean,
  index,
  unique,
} from "drizzle-orm/pg-core";
import { id, createdAt, updatedAt } from "../schemaHelpers";
import { UserTable } from "./user";
import { CourseTable } from "./course";

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
    createdAt,
    updatedAt,
  },
  (t) => [
    // 1 review per user per course
    unique("course_reviews_user_id_course_id_unique").on(t.userId, t.courseId),
    // fast lookup of all reviews for a course page
    index("course_reviews_course_id_idx").on(t.courseId),
  ],
);
