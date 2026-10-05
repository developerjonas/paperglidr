import "server-only"
import { and, eq, gt, inArray, ne, or } from "drizzle-orm"
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
 * Which kind of video a lesson may use, by its course's state:
 *
 * - Free (in any public product priced at 0, even if also sold in a paid
 *   one: anyone can get it for nothing): YouTube/Vimeo links only.
 * - Paid (in a paid product that's live or waiting for review): uploaded
 *   video only; links are public, so they're allowed on previews only.
 * - Draft (not on sale yet): both, while the creator builds it. The rule
 *   is checked when it goes on sale (checkProductFreeTier).
 *
 * Previews are always free-tier: links only. "freeTier" = no hosted video;
 * "embedsAllowed" = links may be used and delivered.
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
  ctx: VideoRules & { hasCourseAccess: boolean },
) {
  if (isHostedVideoAsset(asset)) return mayDeliverHostedVideo(ctx)
  if (isEmbedAsset(asset)) return ctx.embedsAllowed
  return true
}

export type VideoRules = {
  /** Hosted video isn't allowed (a preview, or a free course). */
  freeTier: boolean
  /** YouTube/Vimeo links are allowed (anything but a non-preview lesson of a paid course). */
  embedsAllowed: boolean
}

export const PREVIEW_NEEDS_EMBED_MESSAGE = `Preview lessons need a ${EMBED_PROVIDER_LABELS} link.`
export const FREE_COURSE_NEEDS_EMBED_MESSAGE = `Lessons in a free course need a ${EMBED_PROVIDER_LABELS} link.`
export const PAID_LESSON_NO_EMBED_MESSAGE = `Paid lessons can't use a ${EMBED_PROVIDER_LABELS} link — anyone with the link could watch it. Upload the video instead.`

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

/** The courses (of these) in a paid product that's live or waiting for review. */
export async function getPaidCourseIds(courseIds: string[]) {
  if (courseIds.length === 0) return new Set<string>()
  const rows = await db
    .selectDistinct({ courseId: CourseProductTable.courseId })
    .from(CourseProductTable)
    .innerJoin(ProductTable, eq(ProductTable.id, CourseProductTable.productId))
    .where(
      and(
        inArray(CourseProductTable.courseId, courseIds),
        inArray(ProductTable.status, ["public", "pending_review"]),
        gt(ProductTable.priceInRupees, 0),
      ),
    )
  return new Set(rows.map(row => row.courseId))
}

/** A course's state for the video rule: free, paid or draft. */
export async function getCourseVideoState(courseId: string): Promise<"free" | "paid" | "draft"> {
  if (await isFreeCourse(courseId)) return "free"
  return (await getPaidCourseIds([courseId])).has(courseId) ? "paid" : "draft"
}

/** The video rules for a lesson with this status in a course with this state. */
export function videoRulesFor(status: LessonStatus, courseState: "free" | "paid" | "draft"): VideoRules {
  const freeTier = status === "preview" || courseState === "free"
  return { freeTier, embedsAllowed: freeTier || courseState !== "paid" }
}

/** The video rules for an existing lesson; null if it doesn't exist. */
export async function getLessonVideoRules(lessonId: string): Promise<VideoRules | null> {
  const [row] = await db
    .select({ status: LessonTable.status, courseId: CourseSectionTable.courseId })
    .from(LessonTable)
    .innerJoin(CourseSectionTable, eq(CourseSectionTable.id, LessonTable.sectionId))
    .where(eq(LessonTable.id, lessonId))
    .limit(1)
  if (row == null) return null
  return videoRulesFor(row.status, await getCourseVideoState(row.courseId))
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

/** The video rules a lesson would have with this status, in this section. */
export async function getPlacementVideoRules({ status, sectionId }: { status: LessonStatus; sectionId: string }) {
  const section = await db.query.CourseSectionTable.findFirst({
    where: eq(CourseSectionTable.id, sectionId),
    columns: { courseId: true },
  })
  return videoRulesFor(status, section ? await getCourseVideoState(section.courseId) : "draft")
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
 * - Courses that become paid (the product is submitted or live at a
 *   price, and they aren't free through another product) can't have
 *   YouTube/Vimeo links outside previews.
 *   Unpublishing is always allowed: the course becomes a draft again.
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
  const willBePaid = after.live && after.priceInRupees > 0

  if (willBeFree) {
    const freeElsewhere = await getFreeCourseIds(after.courseIds, { excludeProductId: productId })
    const newlyFree = after.courseIds.filter(id => !freeElsewhere.has(id) && !(wasFree && beforeCourseIds.includes(id)))
    const hosted = await conflictingLessons(newlyFree, "hosted")
    if (hosted.length > 0) {
      return `A free product's lessons need ${EMBED_PROVIDER_LABELS} links, not uploaded video. Replace the video in ${listLessons(hosted)} first.`
    }
  }

  if (willBePaid) {
    const freeElsewhere = await getFreeCourseIds(after.courseIds, { excludeProductId: productId })
    const embeds = await conflictingLessons(after.courseIds.filter(id => !freeElsewhere.has(id)), "embed")
    if (embeds.length > 0) {
      return `Paid lessons can't use ${EMBED_PROVIDER_LABELS} links: anyone with the link could watch them. Upload the video (or make the lesson a free preview) for ${listLessons(embeds)} first.`
    }
  }

  return null
}
