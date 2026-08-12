import { pgTable, text, uuid } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createdAt, id, updatedAt } from "../schemaHelpers";
import { LessonQuestionTable } from "./lessonQuestion";
import { UserTable } from "./user";

export const LessonQuestionReplyTable = pgTable("lesson_question_replies", {
  id: id(),

  questionId: uuid("question_id")
    .notNull()
    .references(() => LessonQuestionTable.id, { onDelete: "cascade" }),

  userId: uuid("user_id")
    .notNull()
    .references(() => UserTable.id, { onDelete: "cascade" }),

  body: text().notNull(),

  createdAt,
  updatedAt,
});

export const LessonQuestionReplyRelationships = relations(
  LessonQuestionReplyTable,
  ({ one }) => ({
    question: one(LessonQuestionTable, {
      fields: [LessonQuestionReplyTable.questionId],
      references: [LessonQuestionTable.id],
    }),
    user: one(UserTable, {
      fields: [LessonQuestionReplyTable.userId],
      references: [UserTable.id],
    }),
  }),
);
