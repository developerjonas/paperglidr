import { db } from "@/drizzle/db"
import { CourseTable } from "@/drizzle/schema"
import { revalidateCourseCache } from "./cache/courses"
import { eq } from "drizzle-orm"

// apps/web/src/features/courses/db/courses.ts — append to the existing file
import { avg, count } from "drizzle-orm"
import { ProductTable, CourseReviewTable } from "@/drizzle/schema"


export async function insertCourse(data: typeof CourseTable.$inferInsert) {
  const [newCourse] = await db.insert(CourseTable).values(data).returning()
  if (newCourse == null) throw new Error("Failed to create course")
  revalidateCourseCache(newCourse.id)

  return newCourse
}

export async function updateCourse(
  id: string,
  data: Partial<typeof CourseTable.$inferInsert>
) {
  const [updatedCourse] = await db
    .update(CourseTable)
    .set(data)
    .where(eq(CourseTable.id, id))
    .returning()
  if (updatedCourse == null) throw new Error("Failed to update course")
  revalidateCourseCache(updatedCourse.id)

  return updatedCourse
}

export async function deleteCourse(id: string) {
  const [deletedCourse] = await db
    .delete(CourseTable)
    .where(eq(CourseTable.id, id))
    .returning()
  if (deletedCourse == null) throw new Error("Failed to delete course")
  revalidateCourseCache(deletedCourse.id)

  return deletedCourse
}

/**
 * Public course/product listing for the mobile Browse screen.
 * Verify: ProductTable.priceInRupees, ProductTable.status,
 * ReviewTable.productId against your real schema files.
 */
export async function getPublicCourseListings() {
  const rows = await db
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
    .leftJoin(CourseReviewTable, eq(CourseReviewTable.courseId, ProductTable.id))
    .where(eq(ProductTable.status, "public"))
    .groupBy(ProductTable.id)

  return rows.map(r => ({
    ...r,
    avgRating: r.avgRating ? Number(r.avgRating) : null,
  }))
}

export async function getPublicCourseDetail(courseId: string) {
  const [course] = await db.select().from(CourseTable).where(eq(CourseTable.id, courseId))
  return course ?? null
}
