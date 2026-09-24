import { db } from "@/drizzle/db";
import { LessonAssetTable } from "@/drizzle/schema/lessonAsset";
import { StorageDeletionTable } from "@/drizzle/schema/storageDeletion";
import { and, desc, eq, ne } from "drizzle-orm";
import {
  getLessonAssetLessonIdTag,
  revalidateLessonAssetCache,
} from "./cache/lessonAssets";
import { cacheTag } from "next/dist/server/use-cache/cache-tag";
// ^ same import path as lessons/[lessonId]/page.tsx's getLesson()

export async function insertLessonAsset(
  data: typeof LessonAssetTable.$inferInsert
) {
  const [newAsset] = await db
    .insert(LessonAssetTable)
    .values(data)
    .returning();

  if (newAsset == null) throw new Error("Failed to create lesson asset");

  revalidateLessonAssetCache({ id: newAsset.id, lessonId: newAsset.lessonId });
  return newAsset;
}

// Uncached — used by the editor's action right after a mutation, and by
// the delivery route where freshness matters more than avoiding a query.
export async function getLessonAsset(id: string) {
  return db.query.LessonAssetTable.findFirst({
    where: eq(LessonAssetTable.id, id),
  });
}

// Uncached — editor's asset list, always wants current state post-mutation.
export async function getLessonAssetsForLesson(lessonId: string) {
  return db.query.LessonAssetTable.findMany({
    where: eq(LessonAssetTable.lessonId, lessonId),
    orderBy: (assets, { asc }) => [asc(assets.order)],
  });
}

/**
 * Cached — powers the student-facing lesson page. Mirrors getLesson()'s
 * "use cache" + cacheTag pattern in lessons/[lessonId]/page.tsx.
 */
export async function getPrimaryLessonAsset(lessonId: string) {
  "use cache";
  cacheTag(getLessonAssetLessonIdTag(lessonId));

  return db.query.LessonAssetTable.findFirst({
    where: and(
      eq(LessonAssetTable.lessonId, lessonId),
      eq(LessonAssetTable.role, "primary"),
      eq(LessonAssetTable.status, "ready")
    ),
    orderBy: desc(LessonAssetTable.createdAt),
  });
}

/**
 * Cached — downloadable extras shown alongside the primary asset on the
 * lesson page (slides, worksheets, source files).
 */
export async function getAttachmentLessonAssets(lessonId: string) {
  "use cache";
  cacheTag(getLessonAssetLessonIdTag(lessonId));

  return db.query.LessonAssetTable.findMany({
    where: and(
      eq(LessonAssetTable.lessonId, lessonId),
      eq(LessonAssetTable.role, "attachment"),
      eq(LessonAssetTable.status, "ready")
    ),
    orderBy: (assets, { asc }) => [asc(assets.order)],
  });
}

// Longer than any signed URL the deliver route hands out (videos: at most
// 3 hours), so a file that's still being watched isn't pulled mid-lesson.
export const STORAGE_DELETION_DELAY_MS = 4 * 60 * 60 * 1000;

type Tx = Omit<typeof db, "$client">;

async function queueStorageDeletion(
  rows: { storageKey: string | null }[],
  reason: "replaced" | "removed",
  trx: Tx,
) {
  const keys = rows.map((row) => row.storageKey).filter((key): key is string => key != null);
  if (keys.length === 0) return;
  const deleteAfter = new Date(Date.now() + STORAGE_DELETION_DELAY_MS);
  await trx
    .insert(StorageDeletionTable)
    .values(keys.map((storageKey) => ({ storageKey, reason, deleteAfter })));
}

/** Deletes the row; its R2 object is queued for deletion (see above). */
export async function deleteLessonAsset(id: string) {
  const deleted = await db.transaction(async (trx) => {
    const [row] = await trx
      .delete(LessonAssetTable)
      .where(eq(LessonAssetTable.id, id))
      .returning();
    if (row) await queueStorageDeletion([row], "removed", trx);
    return row;
  });

  if (deleted) {
    revalidateLessonAssetCache({ id: deleted.id, lessonId: deleted.lessonId });
  }
  return deleted;
}

/**
 * A confirmed upload goes live. A lesson shows one primary asset, so a new
 * ready primary replaces the previous ones. Their R2 objects are queued
 * for deletion after STORAGE_DELETION_DELAY_MS, not deleted in-request.
 */
export async function markLessonAssetReady(id: string) {
  const ready = await db.transaction(async (tx) => {
    const [asset] = await tx
      .update(LessonAssetTable)
      .set({ status: "ready" })
      .where(and(eq(LessonAssetTable.id, id), eq(LessonAssetTable.status, "pending")))
      .returning();
    if (asset == null) return null;

    if (asset.role === "primary") {
      const replaced = await tx
        .delete(LessonAssetTable)
        .where(
          and(
            eq(LessonAssetTable.lessonId, asset.lessonId),
            eq(LessonAssetTable.role, "primary"),
            eq(LessonAssetTable.status, "ready"),
            ne(LessonAssetTable.id, asset.id)
          )
        )
        .returning({ storageKey: LessonAssetTable.storageKey });
      await queueStorageDeletion(replaced, "replaced", tx);
    }
    return asset;
  });

  if (ready) revalidateLessonAssetCache({ id: ready.id, lessonId: ready.lessonId });
  return ready;
}
