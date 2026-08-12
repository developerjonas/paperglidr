import { db } from "@/drizzle/db"
import {
  CourseSectionTable,
  LessonTable,
  LessonAssetTable,
  InstructorTable,
  ProductTable,
  UserRole,
} from "@/drizzle/schema"
import { eq, and, inArray, ne, count } from "drizzle-orm"

const MIN_DESCRIPTION_LENGTH = 100 // ADJUST to your real minimum

// Trust tiers for concurrent live-product caps. Currently phone-verified
// vs not, only. Space left to layer in account age or sales history later
// (e.g. "7+ days old and 1+ completed sale bumps the cap by 1") — not
// implemented yet, just flagged as the obvious next lever.
const UNVERIFIED_LIVE_PRODUCT_CAP = 1
const PHONE_VERIFIED_LIVE_PRODUCT_CAP = 3

export type PublishCheckResult =
  | { canPublish: true }
  | { canPublish: false; reasons: string[] }

export async function canPublishProduct({
  description,
  courseIds,
  authorId,
  role,
  excludeProductId,
}: {
  description: string
  courseIds: string[]
  authorId: string
  role: UserRole | undefined
  // Pass the product's own id when re-saving an already-public product,
  // so it doesn't count against its own creator's cap.
  excludeProductId?: string
}): Promise<PublishCheckResult> {
  const reasons: string[] = []

  if (description.trim().length < MIN_DESCRIPTION_LENGTH) {
    reasons.push(
      `Description must be at least ${MIN_DESCRIPTION_LENGTH} characters (currently ${description.trim().length}).`,
    )
  }

  if (courseIds.length === 0) {
    reasons.push("Add at least one course before publishing.")
  } else if (!(await productHasPreviewVideo(courseIds))) {
    reasons.push(
      'Add at least one lesson marked "preview" with a video (YouTube or uploaded file) before publishing.',
    )
  }

  // Admins have no publishing cap, per explicit instruction — one admin
  // account should never be blocked here.
  if (role !== "admin") {
    const capCheck = await checkLiveProductCap(authorId, excludeProductId)
    if (!capCheck.ok) reasons.push(capCheck.reason)
  }

  return reasons.length === 0 ? { canPublish: true } : { canPublish: false, reasons }
}

async function checkLiveProductCap(
  authorId: string,
  excludeProductId?: string,
): Promise<{ ok: true } | { ok: false; reason: string }> {
  const instructor = await db.query.InstructorTable.findFirst({
    where: eq(InstructorTable.userId, authorId),
    columns: { phoneVerifiedAt: true },
  })

  const cap =
    instructor?.phoneVerifiedAt != null
      ? PHONE_VERIFIED_LIVE_PRODUCT_CAP
      : UNVERIFIED_LIVE_PRODUCT_CAP

  const [row] = await db
    .select({ liveCount: count() })
    .from(ProductTable)
    .where(
      and(
        eq(ProductTable.authorId, authorId),
        eq(ProductTable.status, "public"),
        excludeProductId ? ne(ProductTable.id, excludeProductId) : undefined,
      ),
    )

  const liveCount = row?.liveCount ?? 0

  if (liveCount >= cap) {
    return {
      ok: false,
      reason:
        instructor?.phoneVerifiedAt != null
          ? `You've reached your limit of ${cap} live products. Unpublish one before publishing another.`
          : `Unverified creators can have ${cap} live product at a time. Verify your phone to publish up to ${PHONE_VERIFIED_LIVE_PRODUCT_CAP}.`,
    }
  }

  return { ok: true }
}

async function productHasPreviewVideo(courseIds: string[]): Promise<boolean> {
  const sections = await db
    .select({ id: CourseSectionTable.id })
    .from(CourseSectionTable)
    .where(inArray(CourseSectionTable.courseId, courseIds))
  if (sections.length === 0) return false

  const previewLessons = await db
    .select({ id: LessonTable.id })
    .from(LessonTable)
    .where(
      and(
        inArray(LessonTable.sectionId, sections.map((s) => s.id)),
        eq(LessonTable.status, "preview"),
      ),
    )
  if (previewLessons.length === 0) return false

  const [videoAsset] = await db
    .select({ id: LessonAssetTable.id })
    .from(LessonAssetTable)
    .where(
      and(
        inArray(LessonAssetTable.lessonId, previewLessons.map((l) => l.id)),
        eq(LessonAssetTable.role, "primary"),
        inArray(LessonAssetTable.type, ["youtube", "video_file"]),
      ),
    )
    .limit(1)

  return videoAsset != null
}
