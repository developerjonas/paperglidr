import { and, count, desc, eq, sql } from "drizzle-orm"
import { cacheTag } from "next/dist/server/use-cache/cache-tag"
import { db } from "@/drizzle/db"
import {
  CourseProductTable,
  CourseReviewTable,
  CourseSectionTable,
  InstructorTable,
  LessonTable,
  ProductTable,
  UserTable,
} from "@/drizzle/schema"
import { getProductGlobalTag } from "./cache"
import { getInstructorGlobalTag } from "@/features/instructors/db/cache/instructors"
import { getCourseReviewGlobalTag } from "@/features/reviews/db/cache"
import { getLessonGlobalTag } from "@/features/lessons/db/cache/lessons"
import { getCourseSectionGlobalTag } from "@/features/courseSections/db/cache"

export type HomeCourse = {
  id: string
  name: string
  imageUrl: string
  priceInRupees: number
  categoryId: string | null
  createdAt: Date
  /** Pinned to the home page by an admin; null = not featured. */
  featuredAt: Date | null
  instructorName: string
  instructorHandle: string | null
  instructorVerified: boolean
  instructorFounding: boolean
  avgRating: number | null
  reviewCount: number
  lessonCount: number
}

export type HomeInstructor = {
  handle: string
  name: string
  profileImageUrl: string
  isVerified: boolean
  isFounding: boolean
  productCount: number
}

/**
 * Everything the home page shows: every public product with its
 * instructor, rating and published-lesson count (counted in subqueries so
 * the joins don't multiply), and the instructors who have something on
 * sale, most products first.
 */
export async function getHomeCatalog(): Promise<{
  courses: HomeCourse[]
  instructors: HomeInstructor[]
}> {
  "use cache"
  cacheTag(
    getProductGlobalTag(),
    getInstructorGlobalTag(),
    getCourseReviewGlobalTag(),
    getLessonGlobalTag(),
    getCourseSectionGlobalTag(),
  )

  // Reviews belong to courses; a product's rating covers every course in it.
  const ratings = db
    .select({
      productId: CourseProductTable.productId,
      avgRating: sql<string | null>`avg(${CourseReviewTable.rating})`.as("avg_rating"),
      reviewCount: count(CourseReviewTable.id).as("review_count"),
    })
    .from(CourseProductTable)
    .innerJoin(
      CourseReviewTable,
      and(eq(CourseReviewTable.courseId, CourseProductTable.courseId), eq(CourseReviewTable.isHidden, false)),
    )
    .groupBy(CourseProductTable.productId)
    .as("ratings")

  // Lessons a buyer can open: public sections, public or preview lessons.
  const lessons = db
    .select({
      productId: CourseProductTable.productId,
      lessonCount: count(LessonTable.id).as("lesson_count"),
    })
    .from(CourseProductTable)
    .innerJoin(
      CourseSectionTable,
      and(eq(CourseSectionTable.courseId, CourseProductTable.courseId), eq(CourseSectionTable.status, "public")),
    )
    .innerJoin(
      LessonTable,
      and(eq(LessonTable.sectionId, CourseSectionTable.id), sql`${LessonTable.status} <> 'private'`),
    )
    .groupBy(CourseProductTable.productId)
    .as("lessons")

  const rows = await db
    .select({
      id: ProductTable.id,
      name: ProductTable.name,
      imageUrl: ProductTable.imageUrl,
      priceInRupees: ProductTable.priceInRupees,
      categoryId: ProductTable.categoryId,
      createdAt: ProductTable.createdAt,
      featuredAt: ProductTable.featuredAt,
      authorName: UserTable.name,
      instructorName: InstructorTable.name,
      instructorHandle: InstructorTable.handle,
      instructorVerified: InstructorTable.isVerified,
      instructorFounding: InstructorTable.isFounding,
      avgRating: ratings.avgRating,
      reviewCount: ratings.reviewCount,
      lessonCount: lessons.lessonCount,
    })
    .from(ProductTable)
    .innerJoin(UserTable, eq(UserTable.id, ProductTable.authorId))
    .leftJoin(InstructorTable, eq(InstructorTable.userId, ProductTable.authorId))
    .leftJoin(ratings, eq(ratings.productId, ProductTable.id))
    .leftJoin(lessons, eq(lessons.productId, ProductTable.id))
    .where(eq(ProductTable.status, "public"))
    .orderBy(desc(ProductTable.createdAt))

  const courses = rows.map(row => ({
    id: row.id,
    name: row.name,
    imageUrl: row.imageUrl,
    priceInRupees: row.priceInRupees,
    categoryId: row.categoryId,
    createdAt: row.createdAt,
    featuredAt: row.featuredAt,
    instructorName: row.instructorName ?? row.authorName,
    instructorHandle: row.instructorHandle,
    instructorVerified: row.instructorVerified ?? false,
    instructorFounding: row.instructorFounding ?? false,
    avgRating: row.avgRating == null ? null : Number(row.avgRating),
    reviewCount: Number(row.reviewCount ?? 0),
    lessonCount: Number(row.lessonCount ?? 0),
  }))

  const instructors = await db
    .select({
      handle: InstructorTable.handle,
      name: InstructorTable.name,
      profileImageUrl: InstructorTable.profileImageUrl,
      isVerified: InstructorTable.isVerified,
      isFounding: InstructorTable.isFounding,
      productCount: count(ProductTable.id),
    })
    .from(InstructorTable)
    .innerJoin(
      ProductTable,
      and(eq(ProductTable.authorId, InstructorTable.userId), eq(ProductTable.status, "public")),
    )
    .groupBy(InstructorTable.id)
    // Founding creators first, then the most courses.
    .orderBy(desc(InstructorTable.isFounding), desc(count(ProductTable.id)), InstructorTable.name)
    .limit(12)

  return {
    courses,
    instructors: instructors.map(i => ({ ...i, productCount: Number(i.productCount) })),
  }
}

