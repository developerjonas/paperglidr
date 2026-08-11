// apps/web/src/drizzle/schema/relations.ts
import { relations } from "drizzle-orm"
import { CourseTable } from "./course"
import { CourseSectionTable } from "./courseSection"
import { LessonTable } from "./lesson"
import { UserTable } from "./user"
import { CourseProductTable } from "./courseProduct"
import { UserCourseAccessTable } from "./userCourseAccess"
import { UserLessonCompleteTable } from "./userLessonComplete"
import { LessonAssetTable } from "./lessonAsset"

export const CourseRelationships = relations(CourseTable, ({ one, many }) => ({
  author: one(UserTable, {
    fields: [CourseTable.authorId],
    references: [UserTable.id],
  }),
  courseProducts: many(CourseProductTable),
  userCourseAccesses: many(UserCourseAccessTable),
  courseSections: many(CourseSectionTable),
}))

export const CourseSectionRelationships = relations(
  CourseSectionTable,
  ({ many, one }) => ({
    course: one(CourseTable, {
      fields: [CourseSectionTable.courseId],
      references: [CourseTable.id],
    }),
    lessons: many(LessonTable),
  })
)

export const LessonRelationships = relations(LessonTable, ({ one, many }) => ({
  section: one(CourseSectionTable, {
    fields: [LessonTable.sectionId],
    references: [CourseSectionTable.id],
  }),
  userLessonsComplete: many(UserLessonCompleteTable),
  assets: many(LessonAssetTable),
}))
