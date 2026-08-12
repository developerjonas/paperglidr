"use server";

import {
  requestLessonAssetUploadSchema,
  mimeTypeToAssetType,
  type RequestLessonAssetUploadInput,
} from "../schemas/lessonAssets";
import { canEditLessonAssets } from "../permissions/lessonAssets";
import {
  insertLessonAsset,
  deleteLessonAsset,
  getLessonAssetsForLesson,
} from "../db/lessonAssets";
import { buildStorageKey, getUploadUrl } from "@/services/storage/r2";

/**
 * Step 1 of upload: instructor's client asks for a place to put the file.
 * We pre-create the LessonAsset row so the lesson editor can reference
 * assetId immediately, then the client PUTs directly to R2.
 *
 * NOTE: does not verify the upload actually completed — add a
 * confirmUpload step (R2 event notification, or a follow-up HEAD check)
 * before trusting fileSizeBytes/mimeType for anything security-sensitive.
 */
export async function requestLessonAssetUploadUrl(
  input: RequestLessonAssetUploadInput
) {
  const parsed = requestLessonAssetUploadSchema.parse(input);

  const lesson = await canEditLessonAssets(parsed.lessonId); // throws if unauthorized

  const type = mimeTypeToAssetType(parsed.mimeType);

  const storageKey = buildStorageKey({
    courseId: lesson.section.course.id,
    lessonId: parsed.lessonId,
    fileName: parsed.fileName,
  });

  const asset = await insertLessonAsset({
    lessonId: parsed.lessonId,
    type,
    provider: "r2", // youtube assets never go through this upload path
    role: parsed.role,
    storageKey,
    fileName: parsed.fileName,
    mimeType: parsed.mimeType,
    fileSizeBytes: parsed.fileSizeBytes,
    downloadable: parsed.downloadable,
    durationSeconds: parsed.durationSeconds ?? null, // new
  });

  const uploadUrl = await getUploadUrl({
    storageKey,
    mimeType: parsed.mimeType,
  });

  return { assetId: asset.id, uploadUrl, storageKey };
}

/**
 * Instructor removes an attachment or replaces a primary asset.
 * Does NOT delete the R2 object itself — add that as an explicit
 * background job if you want storage to actually shrink, rather than
 * risking an in-request delete racing a still-open signed download URL.
 */
export async function removeLessonAsset(assetId: string, lessonId: string) {
  await canEditLessonAssets(lessonId); // throws if unauthorized
  return deleteLessonAsset(assetId);
}

/**
 * Powers the lesson editor's asset list — same permission gate as
 * upload/remove since instructors editing a lesson should see its assets.
 */
export async function listLessonAssetsForEditor(lessonId: string) {
  await canEditLessonAssets(lessonId); // throws if unauthorized
  return getLessonAssetsForLesson(lessonId);
}
