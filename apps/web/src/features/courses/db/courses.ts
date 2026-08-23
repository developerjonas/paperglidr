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
    .leftJoin(
      CourseReviewTable,
      eq(CourseReviewTable.courseId, ProductTable.id),
    )
    .where(eq(ProductTable.status, "public"))
    .groupBy(ProductTable.id);

  const rows = limit ? await query.limit(limit) : await query;

  return rows.map((r) => ({
    ...r,
    avgRating: r.avgRating ? Number(r.avgRating) : null,
  }));
}

// apps/web/src/features/courses/db/courses.ts — replace getPublicCourseDetail
import { CourseSectionTable, LessonTable } from "@/drizzle/schema";
import { asc } from "drizzle-orm";

export async function getPublicCourseDetail(courseId: string) {
  const course = await db.query.CourseTable.findFirst({
    where: eq(CourseTable.id, courseId),
  });
  if (!course) return null;

  const sections = await db
    .select({
      id: CourseSectionTable.id,
      name: CourseSectionTable.name,
      order: CourseSectionTable.order,
    })
    .from(CourseSectionTable)
    .where(eq(CourseSectionTable.courseId, courseId)) // TODO: verify column name
    .orderBy(asc(CourseSectionTable.order));

  const lessons = await db
    .select({
      id: LessonTable.id,
      sectionId: LessonTable.sectionId,
      name: LessonTable.name,
      order: LessonTable.order,
      status: LessonTable.status,
    })
    .from(LessonTable)
    .where(
      inArray(
        LessonTable.sectionId,
        sections.map((s) => s.id),
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
