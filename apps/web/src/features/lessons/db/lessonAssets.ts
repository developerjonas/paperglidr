import { db } from "@/drizzle/db";
import { LessonAssetTable } from "@/drizzle/schema/lessonAsset";
import { eq } from "drizzle-orm";
import { revalidateLessonAssetCache } from "./cache/lessonAssets";
// ASSUMPTION: sibling features wrap cached reads in a helper — commonly
// named `dbCache` or `unstable_cache` directly. If you have a shared
// `dbCache(fn, { tags })` wrapper (check db/lessons.ts), use it here
// instead of the raw db.query calls below for the read functions.

export async function insertLessonAsset(
  data: typeof LessonAssetTable.$inferInsert,
) {
  const [newAsset] = await db.insert(LessonAssetTable).values(data).returning();

  if (newAsset == null) throw new Error("Failed to create lesson asset");

  revalidateLessonAssetCache(newAsset.id);
  return newAsset;
}

export async function getLessonAsset(id: string) {
  // tag: getLessonAssetIdTag(id) — wire into your dbCache wrapper if present
  return db.query.LessonAssetTable.findFirst({
    where: eq(LessonAssetTable.id, id),
  });
}

export async function getLessonAssetsForLesson(lessonId: string) {
  return db.query.LessonAssetTable.findMany({
    where: eq(LessonAssetTable.lessonId, lessonId),
    orderBy: (assets, { asc }) => [asc(assets.order)],
  });
}

export async function deleteLessonAsset(id: string) {
  const [deleted] = await db
    .delete(LessonAssetTable)
    .where(eq(LessonAssetTable.id, id))
    .returning();

  if (deleted) revalidateLessonAssetCache(deleted.id);
  return deleted;
}
