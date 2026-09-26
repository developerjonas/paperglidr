"use server";

import {
  requestLessonAssetUploadSchema,
  type RequestLessonAssetUploadInput,
} from "../schemas/lessonAssets";
import { canEditLessonAssets } from "../permissions/lessonAssets";
import {
  insertLessonAsset,
  deleteLessonAsset,
  getLessonAssetsForLesson,
  getLessonAsset,
  markLessonAssetReady,
} from "../db/lessonAssets";
import {
  buildStorageKey,
  deleteObject,
  getUploadUrl,
  headObject,
  readObjectPrefix,
} from "@/services/storage/r2";
import {
  ALLOWED_MIME_TYPES,
  SIGNATURE_BYTES,
  formatBytes,
  getUploadRule,
} from "../lib/uploadRules";
import { UserFacingError, actionError } from "@/lib/safeError";
import { EMBED_PROVIDERS, INVALID_EMBED_MESSAGE, parseEmbedUrl, toStoredEmbed } from "@repo/video-embeds";
import {
  PAID_LESSON_NO_EMBED_MESSAGE,
  isFreeTierLesson,
  needsEmbedMessage,
} from "../lib/freeTier";

/**
 * Step 1 of upload: the instructor's client asks for a place to put the
 * file. The asset row is created as `pending` — nothing shows it to
 * students until confirmLessonAssetUpload has checked what actually landed
 * in R2. The presigned PUT is signed for this exact content type and
 * length, so the browser can't upload something else to the same URL.
 */
export async function requestLessonAssetUploadUrl(
  input: RequestLessonAssetUploadInput
) {
  try {
    const parsed = requestLessonAssetUploadSchema.parse(input);

    const lesson = await canEditLessonAssets(parsed.lessonId); // throws if unauthorized

    const rule = getUploadRule(parsed.role, parsed.mimeType);
    if (rule == null) {
      throw new UserFacingError(
        parsed.role === "primary"
          ? "Lesson content must be an MP4 video or a PDF."
          : "Attachments must be a PDF, JPEG, PNG or WebP file."
      );
    }
    // Free-tier lessons (previews, free courses) use a YouTube or Vimeo
    // link for their video; Chiyali-hosted video is for paid lessons.
    if (rule.assetType === "video_file" && (await isFreeTierLesson(parsed.lessonId))) {
      throw new UserFacingError(needsEmbedMessage(lesson.status));
    }
    if (parsed.fileSizeBytes > rule.maxBytes) {
      throw new UserFacingError(
        `${rule.label} files can be at most ${formatBytes(rule.maxBytes)}.`
      );
    }

    const storageKey = buildStorageKey({
      courseId: lesson.section.course.id,
      lessonId: parsed.lessonId,
      fileName: parsed.fileName,
    });

    const asset = await insertLessonAsset({
      lessonId: parsed.lessonId,
      type: rule.assetType,
      provider: "r2", // youtube assets never go through this upload path
      role: parsed.role,
      status: "pending",
      storageKey,
      fileName: parsed.fileName,
      mimeType: parsed.mimeType,
      fileSizeBytes: parsed.fileSizeBytes,
      downloadable: parsed.downloadable,
      durationSeconds:
        rule.assetType === "video_file" ? (parsed.durationSeconds ?? null) : null,
    });

    const uploadUrl = await getUploadUrl({
      storageKey,
      mimeType: parsed.mimeType,
      contentLength: parsed.fileSizeBytes,
    });

    return { error: false as const, assetId: asset.id, uploadUrl };
  } catch (error) {
    return actionError(error, "requestLessonAssetUploadUrl", "Couldn't start the upload.");
  }
}

/**
 * Step 2: after the browser's PUT finishes. Checks the object in R2
 * (HeadObject for size and type, plus the first bytes for the file
 * signature) against what was declared and allowed. Pass → `ready`, and a
 * new primary replaces the lesson's previous one. Fail → the object and
 * the row are deleted.
 */
export async function confirmLessonAssetUpload(assetId: string, lessonId: string) {
  try {
    const lesson = await canEditLessonAssets(lessonId); // throws if unauthorized

    const asset = await getLessonAsset(assetId);
    if (asset == null || asset.lessonId !== lessonId || asset.provider !== "r2") {
      throw new UserFacingError("Upload not found.");
    }
    if (asset.status === "ready") return { error: false as const, message: "Uploaded" };
    if (asset.storageKey == null || asset.mimeType == null) {
      throw new Error(`r2 asset ${asset.id} has no storageKey/mimeType`);
    }

    // The lesson may have become free-tier since the upload started.
    const problem =
      asset.type === "video_file" && (await isFreeTierLesson(lessonId))
        ? needsEmbedMessage(lesson.status)
        : await checkStoredObject({
      storageKey: asset.storageKey,
      role: asset.role,
      mimeType: asset.mimeType,
      declaredBytes: asset.fileSizeBytes,
    });

    if (problem != null) {
      await deleteObject(asset.storageKey);
      await deleteLessonAsset(asset.id);
      throw new UserFacingError(problem);
    }

    await markLessonAssetReady(asset.id);
    return { error: false as const, message: "Uploaded" };
  } catch (error) {
    return actionError(error, "confirmLessonAssetUpload", "Couldn't confirm the upload.");
  }
}

async function checkStoredObject({
  storageKey,
  role,
  mimeType,
  declaredBytes,
}: {
  storageKey: string;
  role: "primary" | "attachment";
  mimeType: string;
  declaredBytes: number | null;
}): Promise<string | null> {
  const rule = getUploadRule(role, mimeType);
  if (rule == null) return "This file type isn't allowed.";

  const head = await headObject(storageKey);
  if (head == null || head.contentLength == null) {
    return "The upload didn't reach storage. Please try again.";
  }
  if (head.contentLength > rule.maxBytes) {
    return `${rule.label} files can be at most ${formatBytes(rule.maxBytes)}.`;
  }
  if (declaredBytes != null && head.contentLength !== declaredBytes) {
    return "The uploaded file is incomplete. Please try again.";
  }
  if (head.contentType !== mimeType) {
    return "The uploaded file's type doesn't match. Please try again.";
  }

  const prefix = await readObjectPrefix(storageKey, SIGNATURE_BYTES);
  if (!rule.looksLike(prefix)) {
    return `That file isn't a valid ${rule.label}. Allowed: ${ALLOWED_MIME_TYPES[role].join(", ")}.`;
  }
  return null;
}

/**
 * Sets a YouTube or Vimeo video as the lesson's content — free-tier
 * lessons (previews, free courses) only. The link is normalised by
 * @repo/video-embeds; only the video ID, unlisted hash and start time are
 * stored. Replaces the current primary asset (an uploaded file's R2 object
 * is queued for deletion).
 */
export async function setLessonEmbedVideo(lessonId: string, url: string) {
  try {
    await canEditLessonAssets(lessonId); // throws if unauthorized
    if (!(await isFreeTierLesson(lessonId))) {
      throw new UserFacingError(PAID_LESSON_NO_EMBED_MESSAGE);
    }
    const embed = typeof url === "string" ? parseEmbedUrl(url) : null;
    if (embed == null) throw new UserFacingError(INVALID_EMBED_MESSAGE);
    const stored = toStoredEmbed(embed);
    const label = EMBED_PROVIDERS[embed.provider].label;
    const asset = await insertLessonAsset({
      lessonId,
      type: stored.provider,
      provider: stored.provider,
      role: "primary",
      status: "pending",
      externalId: stored.externalId,
      startSeconds: stored.startSeconds,
      fileName: `${label} ${embed.videoId}`,
    });
    await markLessonAssetReady(asset.id);
    return { error: false as const, message: `${label} video set` };
  } catch (error) {
    return actionError(error, "setLessonEmbedVideo", "Couldn't set the video.");
  }
}

/**
 * Instructor removes an attachment or replaces a primary asset. The R2
 * object is queued and deleted by the cron a few hours later (after any
 * signed URL for it has expired), not in this request.
 */
export async function removeLessonAsset(assetId: string, lessonId: string) {
  await canEditLessonAssets(lessonId); // throws if unauthorized

  // The permission above is for lessonId; the asset must actually belong to
  // that lesson, or any asset could be deleted via a lesson the caller owns.
  const asset = await getLessonAsset(assetId);
  if (asset == null || asset.lessonId !== lessonId) {
    throw new Error("Asset not found");
  }

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
