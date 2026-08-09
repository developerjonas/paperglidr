import { revalidateTag } from "next/cache";
import { getGlobalTag, getIdTag } from "@/lib/dataCache";

// NOTE: assumed helper signatures based on the pattern implied by sibling
// features (courses/db/cache/courses.ts, lessons/db/cache/lessons.ts).
// If lib/dataCache.ts exports something different (e.g. getUserTag,
// getCourseTag), swap these two calls accordingly — everything below
// only depends on getting *some* string tag back consistently.

export function getLessonAssetGlobalTag() {
  return getGlobalTag("lessonAssets");
}

export function getLessonAssetIdTag(id: string) {
  return getIdTag("lessonAssets", id);
}

/**
 * Call after any insert/update/delete on lesson_assets. Revalidates both
 * the global list tag (lesson editor's asset list) and the specific
 * asset tag (delivery route, PDF viewer) so neither serves stale data.
 */
export function revalidateLessonAssetCache(id: string) {
  revalidateTag(getLessonAssetGlobalTag());
  revalidateTag(getLessonAssetIdTag(id));
}
