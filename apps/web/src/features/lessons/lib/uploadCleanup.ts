import "server-only"
import { and, asc, eq, inArray, lte } from "drizzle-orm"
import { db } from "@/drizzle/db"
import { LessonAssetTable, StorageDeletionTable } from "@/drizzle/schema"
import { deleteObject as deleteR2Object } from "@/services/storage/r2"
import { revalidateLessonAssetCache } from "../db/cache/lessonAssets"
import { captureEvent } from "@/lib/observability"

// An upload that was never confirmed within a day is abandoned (the
// presigned PUT URL itself expires after 5 minutes).
export const STALE_PENDING_UPLOAD_MS = 24 * 60 * 60 * 1000

type DeleteObject = (storageKey: string) => Promise<void>

/**
 * Cron step (runs with payment reconciliation):
 * 1. pending lesson assets older than 24 hours: R2 object, then the row
 * 2. queued R2 objects of replaced/removed assets whose delay has passed
 *    (skipped if some asset row still points at the key)
 * Per item: a failure is counted and left for the next run.
 */
export async function cleanUpUploads({
  now = new Date(),
  limit = 100,
  deleteObject = deleteR2Object,
}: { now?: Date; limit?: number; deleteObject?: DeleteObject } = {}) {
  const summary = { stalePendingDeleted: 0, queuedObjectsDeleted: 0, failed: 0 }

  const stale = await db
    .select({ id: LessonAssetTable.id, lessonId: LessonAssetTable.lessonId, storageKey: LessonAssetTable.storageKey })
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
      if (asset.storageKey) await deleteObject(asset.storageKey)
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
  const stillReferenced = new Set(
    due.length === 0
      ? []
      : (
          await db
            .select({ storageKey: LessonAssetTable.storageKey })
            .from(LessonAssetTable)
            .where(inArray(LessonAssetTable.storageKey, due.map(row => row.storageKey)))
        ).map(row => row.storageKey),
  )
  for (const row of due) {
    try {
      if (!stillReferenced.has(row.storageKey)) {
        await deleteObject(row.storageKey)
        summary.queuedObjectsDeleted++
      }
      await db.delete(StorageDeletionTable).where(eq(StorageDeletionTable.id, row.id))
    } catch (error) {
      console.error(`[uploads] could not delete queued object ${row.storageKey}`, error)
      summary.failed++
    }
  }

  if (summary.failed > 0) {
    captureEvent("Upload cleanup: some R2 deletions failed", { area: "cleanup" }, {
      level: "warning",
      extra: summary,
    })
  }
  return summary
}
