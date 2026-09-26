import "server-only"
import { and, eq, inArray } from "drizzle-orm"
import { db } from "@/drizzle/db"
import {
  CourseProductTable,
  CourseSectionTable,
  LessonTable,
  ProductTable,
  type AssetProvider,
  type AssetType,
} from "@/drizzle/schema"

/**
 * Free-tier lessons use external embeds (YouTube, Vimeo) for their video;
 * Chiyali-hosted video (R2 MP4, Bunny) is for paid, enrolled content only.
 *
 * A lesson is free-tier if it's a preview, or its course is in any public
 * product priced at 0 — even if the course is also sold in a paid product,
 * since anyone can get it for nothing.
 */

/** Chiyali-hosted video: an uploaded MP4 on R2, or anything on Bunny. PDFs and images aren't. */
export function isHostedVideoAsset(asset: { provider: AssetProvider; type: AssetType }) {
  return asset.provider === "bunny" || (asset.provider === "r2" && asset.type === "video_file")
}

/** The courses (of these) that are in a public product priced at 0. */
export async function getFreeCourseIds(courseIds: string[]) {
  if (courseIds.length === 0) return new Set<string>()
  const rows = await db
    .selectDistinct({ courseId: CourseProductTable.courseId })
    .from(CourseProductTable)
    .innerJoin(ProductTable, eq(ProductTable.id, CourseProductTable.productId))
    .where(
      and(
        inArray(CourseProductTable.courseId, courseIds),
        eq(ProductTable.status, "public"),
        eq(ProductTable.priceInRupees, 0),
      ),
    )
  return new Set(rows.map(row => row.courseId))
}

export async function isFreeCourse(courseId: string) {
  return (await getFreeCourseIds([courseId])).has(courseId)
}

/** Whether a lesson is free-tier. False for a lesson that doesn't exist. */
export async function isFreeTierLesson(lessonId: string) {
  const [row] = await db
    .select({ status: LessonTable.status, courseId: CourseSectionTable.courseId })
    .from(LessonTable)
    .innerJoin(CourseSectionTable, eq(CourseSectionTable.id, LessonTable.sectionId))
    .where(eq(LessonTable.id, lessonId))
    .limit(1)
  if (row == null) return false
  if (row.status === "preview") return true
  return isFreeCourse(row.courseId)
}

/**
 * Hosted video goes only to viewers with real access to the course (not
 * preview access) and never for a free-tier lesson.
 */
export function mayDeliverHostedVideo({
  freeTier,
  hasCourseAccess,
}: {
  freeTier: boolean
  hasCourseAccess: boolean
}) {
  return !freeTier && hasCourseAccess
}
