import { db } from "@/drizzle/db";
import { LessonAssetTable } from "@/drizzle/schema/lessonAsset";
import { and, eq } from "drizzle-orm";
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
      eq(LessonAssetTable.role, "primary")
    ),
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
      eq(LessonAssetTable.role, "attachment")
    ),
    orderBy: (assets, { asc }) => [asc(assets.order)],
  });
}

export async function deleteLessonAsset(id: string) {
  const [deleted] = await db
    .delete(LessonAssetTable)
    .where(eq(LessonAssetTable.id, id))
    .returning();

  if (deleted) {
    revalidateLessonAssetCache({ id: deleted.id, lessonId: deleted.lessonId });
  }
  return deleted;
}
