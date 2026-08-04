import { relations } from "drizzle-orm"
import { pgTable, text, uuid } from "drizzle-orm/pg-core"
import { createdAt, id, updatedAt } from "../schemaHelpers"
import { CourseProductTable } from "./courseProduct"
import { UserCourseAccessTable } from "./userCourseAccess"
import { CourseSectionTable } from "./courseSection"
import { UserTable } from "./user"

export const CourseTable = pgTable("courses", {
  id,
  name: text().notNull(),
  description: text().notNull(),
  authorId: uuid("author_id")
    .notNull()
    .references(() => UserTable.id, { onDelete: "cascade" }),
  createdAt,
  updatedAt,
})

export const CourseRelationships = relations(CourseTable, ({ one, many }) => ({
  author: one(UserTable, {
    fields: [CourseTable.authorId],
    references: [UserTable.id],
  }),
  courseProducts: many(CourseProductTable),
  userCourseAccesses: many(UserCourseAccessTable),
  courseSections: many(CourseSectionTable),
}))
