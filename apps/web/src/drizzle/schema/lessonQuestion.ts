import { pgTable, text, uuid } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createdAt, id, updatedAt } from "../schemaHelpers";
import { LessonTable } from "./lesson";
import { UserTable } from "./user";
import { LessonQuestionReplyTable } from "./lessonQuestionReply";

export const LessonQuestionTable = pgTable("lesson_questions", {
  id: id(),

  lessonId: uuid("lesson_id")
    .notNull()
    .references(() => LessonTable.id, { onDelete: "cascade" }),

  userId: uuid("user_id")
    .notNull()
    .references(() => UserTable.id, { onDelete: "cascade" }),

  body: text().notNull(),

  createdAt,
  updatedAt,
});

export const LessonQuestionRelationships = relations(
  LessonQuestionTable,
  ({ one, many }) => ({
    lesson: one(LessonTable, {
      fields: [LessonQuestionTable.lessonId],
      references: [LessonTable.id],
    }),
    user: one(UserTable, {
      fields: [LessonQuestionTable.userId],
      references: [UserTable.id],
    }),
    replies: many(LessonQuestionReplyTable),
  }),
);
