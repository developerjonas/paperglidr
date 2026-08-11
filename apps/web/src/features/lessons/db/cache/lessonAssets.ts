import { revalidateTag } from "next/cache";
import { getGlobalTag, getIdTag } from "@/lib/dataCache";

// Confirmed pattern from lessons/page.tsx: cacheTag(getLessonIdTag(id))
// inside a "use cache" function. Mirroring the same getGlobalTag/getIdTag
// convention here. Two id-shaped tags are needed since asset reads happen
// two ways: by the asset's own id (delivery route) and by lessonId
// (lesson page's "what's the primary asset for this lesson" query,
// lesson editor's "list all assets for this lesson" query).

export function getLessonAssetGlobalTag() {
  return getGlobalTag("lessonAssets");
}

export function getLessonAssetIdTag(assetId: string) {
  return getIdTag("lessonAssets", assetId);
}

export function getLessonAssetLessonIdTag(lessonId: string) {
  return getIdTag("lessonAssetsByLesson", lessonId);
}

/**
 * Call after any insert/update/delete on lesson_assets. Revalidates the
 * global list tag, the specific asset tag, and the lesson-scoped tag
 * (used by the lesson page's primary-asset query and the editor's list
 * query) so none of the three serve stale data.
 */
export function revalidateLessonAssetCache({
  id,
  lessonId,
}: {
  id: string;
  lessonId: string;
}) {
  revalidateTag(getLessonAssetGlobalTag());
  revalidateTag(getLessonAssetIdTag(id));
  revalidateTag(getLessonAssetLessonIdTag(lessonId));
}
