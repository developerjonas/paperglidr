import "server-only"
import { and, eq, inArray, ne, or } from "drizzle-orm"
import { EMBED_PROVIDER_LABELS, EMBED_PROVIDER_NAMES, isEmbedProvider } from "@repo/video-embeds"
import { db } from "@/drizzle/db"
import {
  CourseProductTable,
  CourseSectionTable,
  CourseTable,
  LessonAssetTable,
  LessonTable,
  ProductTable,
  type AssetProvider,
  type AssetType,
  type LessonStatus,
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

/** A YouTube or Vimeo embed — free-tier lessons only. */
export function isEmbedAsset(asset: { provider: AssetProvider }) {
  return isEmbedProvider(asset.provider)
}

/**
 * Whether this viewer may be given this asset at all, as far as the
 * free-tier rule goes: embeds only on free-tier lessons (paid content
 * isn't left on a public link), hosted video per mayDeliverHostedVideo.
 */
export function mayDeliverAsset(
  asset: { provider: AssetProvider; type: AssetType },
  ctx: { freeTier: boolean; hasCourseAccess: boolean },
) {
  if (isHostedVideoAsset(asset)) return mayDeliverHostedVideo(ctx)
  if (isEmbedAsset(asset)) return ctx.freeTier
  return true
}

export const PREVIEW_NEEDS_EMBED_MESSAGE = `Preview lessons need a ${EMBED_PROVIDER_LABELS} link.`
export const FREE_COURSE_NEEDS_EMBED_MESSAGE = `Lessons in a free course need a ${EMBED_PROVIDER_LABELS} link.`
export const PAID_LESSON_NO_EMBED_MESSAGE = `Paid lessons can't use a ${EMBED_PROVIDER_LABELS} link — anyone with the link could watch it. Upload an MP4 instead.`

/** The courses (of these) that are in a public product priced at 0. */
export async function getFreeCourseIds(courseIds: string[], { excludeProductId }: { excludeProductId?: string } = {}) {
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
        excludeProductId ? ne(ProductTable.id, excludeProductId) : undefined,
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

/** Whether a lesson with this status, in this section, would be free-tier. */
export async function isFreeTierPlacement({ status, sectionId }: { status: LessonStatus; sectionId: string }) {
  if (status === "preview") return true
  const section = await db.query.CourseSectionTable.findFirst({
    where: eq(CourseSectionTable.id, sectionId),
    columns: { courseId: true },
  })
  return section != null && (await isFreeCourse(section.courseId))
}

/** Why hosted video isn't allowed on a free-tier lesson with this status. */
export function needsEmbedMessage(status: LessonStatus) {
  return status === "preview" ? PREVIEW_NEEDS_EMBED_MESSAGE : FREE_COURSE_NEEDS_EMBED_MESSAGE
}

const hostedVideoCondition = or(
  eq(LessonAssetTable.provider, "bunny"),
  and(eq(LessonAssetTable.provider, "r2"), eq(LessonAssetTable.type, "video_file")),
)
const embedCondition = inArray(LessonAssetTable.provider, EMBED_PROVIDER_NAMES)

/** Whether the lesson has Chiyali-hosted video (uploaded or still uploading). */
export async function lessonHasHostedVideo(lessonId: string) {
  const [row] = await db
    .select({ id: LessonAssetTable.id })
    .from(LessonAssetTable)
    .where(and(eq(LessonAssetTable.lessonId, lessonId), hostedVideoCondition))
    .limit(1)
  return row != null
}

/** Whether the lesson uses a YouTube or Vimeo embed. */
export async function lessonHasEmbed(lessonId: string) {
  const [row] = await db
    .select({ id: LessonAssetTable.id })
    .from(LessonAssetTable)
    .where(and(eq(LessonAssetTable.lessonId, lessonId), embedCondition))
    .limit(1)
  return row != null
}

export type ConflictingLesson = { lessonId: string; lessonName: string; courseName: string }

/**
 * Lessons in these courses with hosted video (kind "hosted") — what stops a
 * course going free — or non-preview lessons with an embed (kind "embed") —
 * what stops a free course becoming paid.
 */
export async function conflictingLessons(courseIds: string[], kind: "hosted" | "embed"): Promise<ConflictingLesson[]> {
  if (courseIds.length === 0) return []
  const rows = await db
    .selectDistinct({ lessonId: LessonTable.id, lessonName: LessonTable.name, courseName: CourseTable.name })
    .from(LessonAssetTable)
    .innerJoin(LessonTable, eq(LessonTable.id, LessonAssetTable.lessonId))
    .innerJoin(CourseSectionTable, eq(CourseSectionTable.id, LessonTable.sectionId))
    .innerJoin(CourseTable, eq(CourseTable.id, CourseSectionTable.courseId))
    .where(
      and(
        inArray(CourseSectionTable.courseId, courseIds),
        kind === "hosted" ? hostedVideoCondition : and(embedCondition, ne(LessonTable.status, "preview")),
      ),
    )
  return rows.sort((a, b) => a.courseName.localeCompare(b.courseName) || a.lessonName.localeCompare(b.lessonName))
}

function listLessons(lessons: ConflictingLesson[]) {
  const shown = lessons.slice(0, 5).map(l => `"${l.lessonName}" (${l.courseName})`)
  const more = lessons.length > 5 ? ` and ${lessons.length - 5} more` : ""
  return `${shown.join(", ")}${more}`
}

/**
 * The free-tier check for saving or approving a product. `after` is what
 * the product will be; `before` what it is now (null when new).
 *
 * - Courses that become free (the product is public at price 0, and they
 *   weren't free already) can't have hosted video in any lesson.
 * - Courses that stop being free while the product stays live (price
 *   raised, course removed) can't have embeds outside previews.
 *   Unpublishing is always allowed; the embeds just stop playing (the
 *   report script lists them).
 *
 * Returns an error message, or null when the change is fine.
 */
export async function checkProductFreeTier({
  productId,
  after,
}: {
  productId?: string
  after: { live: boolean; priceInRupees: number; courseIds: string[] }
}): Promise<string | null> {
  const before = productId
    ? await db.query.ProductTable.findFirst({
        where: eq(ProductTable.id, productId),
        columns: { status: true, priceInRupees: true },
        with: { courseProducts: { columns: { courseId: true } } },
      })
    : null
  const beforeCourseIds = before?.courseProducts.map(cp => cp.courseId) ?? []
  const wasFree = before?.status === "public" && before.priceInRupees === 0
  const willBeFree = after.live && after.priceInRupees === 0

  if (willBeFree) {
    const freeElsewhere = await getFreeCourseIds(after.courseIds, { excludeProductId: productId })
    const newlyFree = after.courseIds.filter(id => !freeElsewhere.has(id) && !(wasFree && beforeCourseIds.includes(id)))
    const hosted = await conflictingLessons(newlyFree, "hosted")
    if (hosted.length > 0) {
      return `A free product's lessons need ${EMBED_PROVIDER_LABELS} links, not uploaded video. Replace the video in ${listLessons(hosted)} first.`
    }
  }

  if (wasFree && after.live) {
    const leaving = beforeCourseIds.filter(id => !willBeFree || !after.courseIds.includes(id))
    const stillFree = await getFreeCourseIds(leaving, { excludeProductId: productId })
    const embeds = await conflictingLessons(leaving.filter(id => !stillFree.has(id)), "embed")
    if (embeds.length > 0) {
      return `Paid lessons can't use ${EMBED_PROVIDER_LABELS} links. Upload an MP4 (or make the lesson a preview) for ${listLessons(embeds)} first.`
    }
  }

  return null
}
