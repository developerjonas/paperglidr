import { db } from "@/drizzle/db";
import { CourseTable, UserCourseAccessTable, UserLessonCompleteTable } from "@/drizzle/schema";
import { revalidateCourseCache } from "./cache/courses";
import { and, eq, inArray } from "drizzle-orm";

// apps/web/src/features/courses/db/courses.ts — append to the existing file
import { avg, count } from "drizzle-orm";
import { ProductTable, CourseReviewTable } from "@/drizzle/schema";

export async function insertCourse(data: typeof CourseTable.$inferInsert) {
  const [newCourse] = await db.insert(CourseTable).values(data).returning();
  if (newCourse == null) throw new Error("Failed to create course");
  revalidateCourseCache(newCourse.id);

  return newCourse;
}

export async function updateCourse(
  id: string,
  data: Partial<typeof CourseTable.$inferInsert>,
) {
  const [updatedCourse] = await db
    .update(CourseTable)
    .set(data)
    .where(eq(CourseTable.id, id))
    .returning();
  if (updatedCourse == null) throw new Error("Failed to update course");
  revalidateCourseCache(updatedCourse.id);

  return updatedCourse;
}

export async function deleteCourse(id: string) {
  const [deletedCourse] = await db
    .delete(CourseTable)
    .where(eq(CourseTable.id, id))
    .returning();
  if (deletedCourse == null) throw new Error("Failed to delete course");
  revalidateCourseCache(deletedCourse.id);

  return deletedCourse;
}

// apps/web/src/features/courses/db/courses.ts — update the signature, rest of the function body unchanged
export async function getPublicCourseListings({
  limit,
}: { limit?: number } = {}) {
  const query = db
    .select({
      id: ProductTable.id,
      name: ProductTable.name,
      description: ProductTable.description,
      imageUrl: ProductTable.imageUrl,
      priceInRupees: ProductTable.priceInRupees,
      avgRating: avg(CourseReviewTable.rating),
      reviewCount: count(CourseReviewTable.id),
    })
    .from(ProductTable)
    // Reviews belong to courses; a product's rating covers every course in it.
    .leftJoin(CourseProductTable, eq(CourseProductTable.productId, ProductTable.id))
    .leftJoin(
      CourseReviewTable,
      and(
        eq(CourseReviewTable.courseId, CourseProductTable.courseId),
        eq(CourseReviewTable.isHidden, false),
      ),
    )
    .where(eq(ProductTable.status, "public"))
    .groupBy(ProductTable.id);

  const rows = limit ? await query.limit(limit) : await query;

  return rows.map((r) => ({
    ...r,
    avgRating: r.avgRating ? Number(r.avgRating) : null,
  }));
}

import { CourseProductTable, CourseSectionTable, LessonTable } from "@/drizzle/schema";
import { asc } from "drizzle-orm";
import { wherePublicCourseSections } from "@/features/courseSections/permissions/sections";
import { wherePublicLessons } from "@/features/lessons/permissions/lessons";

// Public catalogue (GET /api/v1/courses/[id], no auth): only a course that
// is in at least one public product, only its public sections and its
// public/preview lessons, and only fields the product page shows.
export async function getPublicCourseDetail(courseId: string) {
  const [course] = await db
    .select({
      id: CourseTable.id,
      name: CourseTable.name,
      description: CourseTable.description,
    })
    .from(CourseTable)
    .innerJoin(CourseProductTable, eq(CourseProductTable.courseId, CourseTable.id))
    .innerJoin(
      ProductTable,
      and(eq(ProductTable.id, CourseProductTable.productId), eq(ProductTable.status, "public")),
    )
    .where(eq(CourseTable.id, courseId))
    .limit(1);
  if (!course) return null;

  const sections = await db
    .select({
      id: CourseSectionTable.id,
      name: CourseSectionTable.name,
      order: CourseSectionTable.order,
    })
    .from(CourseSectionTable)
    .where(and(eq(CourseSectionTable.courseId, courseId), wherePublicCourseSections))
    .orderBy(asc(CourseSectionTable.order));

  const lessons =
    sections.length === 0
      ? []
      : await db
          .select({
            id: LessonTable.id,
            sectionId: LessonTable.sectionId,
            name: LessonTable.name,
            order: LessonTable.order,
            status: LessonTable.status,
          })
          .from(LessonTable)
          .where(
            and(
              inArray(
                LessonTable.sectionId,
                sections.map((s) => s.id),
              ),
              wherePublicLessons,
            ),
          )
          .orderBy(asc(LessonTable.order));

  return {
    ...course,
    sections: sections.map((section) => ({
      ...section,
      lessons: lessons.filter((l) => l.sectionId === section.id),
    })),
  };
}

/**
 * Courses the signed-in user actually has access to (purchased/granted),
 * with lesson-completion progress. Powers the Home screen's "My Courses" —
 * deliberately NOT the same thing as the public product catalog.
 */
export async function getCoursesForUser(userId: string) {
  const access = await db
    .select({ courseId: UserCourseAccessTable.courseId })
    .from(UserCourseAccessTable)
    .where(eq(UserCourseAccessTable.userId, userId));

  const courseIds = access.map((a) => a.courseId);
  if (courseIds.length === 0) return [];

  const courses = await db
    .select({
      id: CourseTable.id,
      name: CourseTable.name,
      description: CourseTable.description,
    })
    .from(CourseTable)
    .where(inArray(CourseTable.id, courseIds));

  const lessons = await db
    .select({
      courseId: CourseSectionTable.courseId,
      lessonId: LessonTable.id,
    })
    .from(LessonTable)
    .innerJoin(
      CourseSectionTable,
      eq(CourseSectionTable.id, LessonTable.sectionId),
    )
    .where(inArray(CourseSectionTable.courseId, courseIds));

  const lessonIds = lessons.map((l) => l.lessonId);
  const completed = lessonIds.length
    ? await db
        .select({ lessonId: UserLessonCompleteTable.lessonId })
        .from(UserLessonCompleteTable)
        .where(
          and(
            eq(UserLessonCompleteTable.userId, userId),
            inArray(UserLessonCompleteTable.lessonId, lessonIds),
          ),
        )
    : [];
  const completedSet = new Set(completed.map((c) => c.lessonId));

  return courses.map((course) => {
    const courseLessons = lessons.filter((l) => l.courseId === course.id);
    return {
      ...course,
      totalLessons: courseLessons.length,
      completedLessons: courseLessons.filter((l) =>
        completedSet.has(l.lessonId),
      ).length,
    };
  });
}
