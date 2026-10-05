import "server-only"
import { and, asc, eq, lte } from "drizzle-orm"
import { db } from "@/drizzle/db"
import { LessonAssetTable } from "@/drizzle/schema"
import { bunnyVideoState, getBunnyVideo, type BunnyVideo } from "@/services/bunny/stream"
import { deleteLessonAsset, markLessonAssetFailed, markLessonAssetReady } from "../db/lessonAssets"
import { isFreeTierLesson } from "./freeTier"

// A Bunny video that doesn't exist this long after its row was created
// was never uploaded (or was deleted in Bunny): the upload has failed.
const MISSING_VIDEO_GRACE_MS = 60 * 60 * 1000

type Asset = Pick<typeof LessonAssetTable.$inferSelect, "id" | "lessonId" | "provider" | "status" | "externalId" | "createdAt">
type GetVideo = (videoId: string) => Promise<BunnyVideo | null>

/**
 * Brings a pending Bunny lesson video up to date from Bunny's API (never
 * from a webhook's payload): ready once playable, failed if encoding
 * failed. A video that finished after its lesson became free-tier (a
 * preview, or a free course) is removed instead: uploaded video is for
 * paid lessons only. Returns the asset's status afterwards ("removed" if
 * it was deleted).
 */
export async function syncBunnyLessonAsset(
  asset: Asset,
  { getVideo = getBunnyVideo, now = new Date() }: { getVideo?: GetVideo; now?: Date } = {},
): Promise<"pending" | "ready" | "failed" | "removed"> {
  if (asset.provider !== "bunny" || asset.status !== "pending" || !asset.externalId) {
    return asset.status === "ready" || asset.status === "failed" ? asset.status : "pending"
  }

  const video = await getVideo(asset.externalId)
  if (video == null) {
    if (now.getTime() - asset.createdAt.getTime() < MISSING_VIDEO_GRACE_MS) return "pending"
    await markLessonAssetFailed(asset.id)
    return "failed"
  }

  const state = bunnyVideoState(video)
  if (state === "failed") {
    await markLessonAssetFailed(asset.id)
    return "failed"
  }
  if (state === "pending") return "pending"

  if (await isFreeTierLesson(asset.lessonId)) {
    await deleteLessonAsset(asset.id) // queues the Bunny video for deletion
    return "removed"
  }
  await markLessonAssetReady(asset.id, { durationSeconds: video.length > 0 ? Math.round(video.length) : null })
  return "ready"
}

/** Cron step: re-checks pending Bunny videos (in case a webhook was missed), oldest first. */
export async function syncPendingBunnyVideos({
  limit = 25,
  getVideo,
  now = new Date(),
}: { limit?: number; getVideo?: GetVideo; now?: Date } = {}) {
  const pending = await db
    .select({
      id: LessonAssetTable.id,
      lessonId: LessonAssetTable.lessonId,
      provider: LessonAssetTable.provider,
      status: LessonAssetTable.status,
      externalId: LessonAssetTable.externalId,
      createdAt: LessonAssetTable.createdAt,
    })
    .from(LessonAssetTable)
    .where(and(eq(LessonAssetTable.provider, "bunny"), eq(LessonAssetTable.status, "pending"), lte(LessonAssetTable.createdAt, now)))
    .orderBy(asc(LessonAssetTable.updatedAt))
    .limit(limit)

  const summary = { checked: 0, ready: 0, failed: 0, removed: 0, errors: 0 }
  for (const asset of pending) {
    try {
      const result = await syncBunnyLessonAsset(asset, { getVideo, now })
      summary.checked++
      if (result === "ready") summary.ready++
      else if (result === "failed") summary.failed++
      else if (result === "removed") summary.removed++
    } catch (error) {
      console.error(`[bunny] could not sync asset ${asset.id}`, error)
      summary.errors++
    }
  }
  return summary
}
