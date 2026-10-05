import "server-only"
import { and, asc, eq, inArray, lte, or } from "drizzle-orm"
import { db } from "@/drizzle/db"
import { LessonAssetTable, StorageDeletionTable } from "@/drizzle/schema"
import { deleteObject as deleteR2Object } from "@/services/storage/r2"
import { deleteBunnyVideo } from "@/services/bunny/stream"
import { revalidateLessonAssetCache } from "../db/cache/lessonAssets"
import { captureEvent } from "@/lib/observability"

// An upload that was never confirmed within a day is abandoned (an R2
// presigned PUT expires after 5 minutes; a Bunny upload signature after 24
// hours). A Bunny video that finished is made ready before this runs.
export const STALE_PENDING_UPLOAD_MS = 24 * 60 * 60 * 1000
// Failed Bunny encodes stay visible in the editor this long, then go.
export const FAILED_UPLOAD_KEEP_MS = 7 * 24 * 60 * 60 * 1000

type DeleteObject = (storageKey: string) => Promise<void>
type DeleteVideo = (videoId: string) => Promise<void>

/**
 * Cron step (runs with payment reconciliation):
 * 1. pending lesson assets older than 24 hours: the R2 object or Bunny
 *    video, then the row
 * 2. queued R2 objects and Bunny videos of replaced/removed assets whose
 *    delay has passed (skipped if some asset row still points at them)
 * 3. failed uploads older than 7 days (their video was already deleted)
 * Per item: a failure is counted and left for the next run.
 */
export async function cleanUpUploads({
  now = new Date(),
  limit = 100,
  deleteObject = deleteR2Object,
  deleteVideo = deleteBunnyVideo,
}: { now?: Date; limit?: number; deleteObject?: DeleteObject; deleteVideo?: DeleteVideo } = {}) {
  const summary = { stalePendingDeleted: 0, queuedObjectsDeleted: 0, failedUploadsCleared: 0, failed: 0 }

  const stale = await db
    .select({
      id: LessonAssetTable.id,
      lessonId: LessonAssetTable.lessonId,
      provider: LessonAssetTable.provider,
      storageKey: LessonAssetTable.storageKey,
      externalId: LessonAssetTable.externalId,
    })
    .from(LessonAssetTable)
    .where(
      and(
        eq(LessonAssetTable.status, "pending"),
        lte(LessonAssetTable.createdAt, new Date(now.getTime() - STALE_PENDING_UPLOAD_MS)),
      ),
    )
    .orderBy(asc(LessonAssetTable.createdAt))
    .limit(limit)
  for (const asset of stale) {
    try {
      if (asset.provider === "bunny") {
        if (asset.externalId) await deleteVideo(asset.externalId)
      } else if (asset.storageKey) {
        await deleteObject(asset.storageKey)
      }
      // Still pending? (Guards against a confirm landing in between.)
      const [deleted] = await db
        .delete(LessonAssetTable)
        .where(and(eq(LessonAssetTable.id, asset.id), eq(LessonAssetTable.status, "pending")))
        .returning({ id: LessonAssetTable.id })
      if (deleted) {
        revalidateLessonAssetCache({ id: asset.id, lessonId: asset.lessonId })
        summary.stalePendingDeleted++
      }
    } catch (error) {
      console.error(`[uploads] could not clean up pending asset ${asset.id}`, error)
      summary.failed++
    }
  }

  const due = await db
    .select()
    .from(StorageDeletionTable)
    .where(lte(StorageDeletionTable.deleteAfter, now))
    .orderBy(asc(StorageDeletionTable.deleteAfter))
    .limit(limit)
  const keys = due.map(row => row.storageKey)
  const stillReferenced = new Set(
    due.length === 0
      ? []
      : (
          await db
            .select({ storageKey: LessonAssetTable.storageKey, externalId: LessonAssetTable.externalId })
            .from(LessonAssetTable)
            .where(or(inArray(LessonAssetTable.storageKey, keys), inArray(LessonAssetTable.externalId, keys)))
        ).flatMap(row => [row.storageKey, row.externalId]),
  )
  for (const row of due) {
    try {
      if (!stillReferenced.has(row.storageKey)) {
        if (row.provider === "bunny") await deleteVideo(row.storageKey)
        else await deleteObject(row.storageKey)
        summary.queuedObjectsDeleted++
      }
      await db.delete(StorageDeletionTable).where(eq(StorageDeletionTable.id, row.id))
    } catch (error) {
      console.error(`[uploads] could not delete queued ${row.provider} file ${row.storageKey}`, error)
      summary.failed++
    }
  }

  const clearedFailed = await db
    .delete(LessonAssetTable)
    .where(
      and(
        eq(LessonAssetTable.status, "failed"),
        lte(LessonAssetTable.updatedAt, new Date(now.getTime() - FAILED_UPLOAD_KEEP_MS)),
      ),
    )
    .returning({ id: LessonAssetTable.id, lessonId: LessonAssetTable.lessonId })
  for (const asset of clearedFailed) revalidateLessonAssetCache(asset)
  summary.failedUploadsCleared = clearedFailed.length

  if (summary.failed > 0) {
    captureEvent("Upload cleanup: some deletions failed", { area: "cleanup" }, {
      level: "warning",
      extra: summary,
    })
  }
  return summary
}
