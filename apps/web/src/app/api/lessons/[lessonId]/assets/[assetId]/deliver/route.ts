import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/services/auth";
import { getLessonAsset } from "@/features/lessons/db/lessonAssets";
import { canAccessLessonContent } from "@/features/lessons/permissions/lessons";
import { getDownloadUrl } from "@/services/storage/r2";
import { getBunnyEmbedUrl } from "@/services/bunny/streamToken";
import { captureEvent } from "@/lib/observability";
import { routeError } from "@/lib/safeError";

// Signed R2 URLs are the only thing guarding private files once issued,
// so keep them short-lived. PDFs and downloads: 15 minutes. Video: twice
// its length (so a full rewatch doesn't expire mid-lesson), capped.
const DOCUMENT_EXPIRY_SECONDS = 60 * 15;
const DEFAULT_VIDEO_EXPIRY_SECONDS = 60 * 30;
const MAX_VIDEO_EXPIRY_SECONDS = 60 * 60 * 3;

// A signed URL must never be cached by the browser or a proxy.
const noStore = { "Cache-Control": "private, no-store" };
const json = (body: unknown, status = 200) =>
  NextResponse.json(body, { status, headers: noStore });

/**
 * Hands out a short-lived URL for one lesson asset. Access follows
 * canAccessLessonContent: preview lessons for anyone (signed out too),
 * the course author and admins for everything in their course, and
 * purchased access for the rest.
 */
async function handle(
  _req: NextRequest,
  { params }: { params: Promise<{ lessonId: string; assetId: string }> },
) {
  const { lessonId, assetId } = await params;
  const { userId, role } = await getCurrentUser();

  const access = await canAccessLessonContent({ userId, role }, lessonId);
  if (!access.allowed) {
    return access.reason === "not_found"
      ? json({ error: "Lesson not found" }, 404)
      : access.reason === "sign_in_required"
        ? json({ error: "Sign in to watch this lesson" }, 401)
        : json({ error: "Buy this course to watch this lesson" }, 403);
  }

  const asset = await getLessonAsset(assetId);
  // Pending = an upload that hasn't been confirmed yet (task 12).
  if (!asset || asset.lessonId !== lessonId || asset.status !== "ready") {
    return json({ error: "Asset not found" }, 404);
  }

  if (asset.provider === "youtube") {
    return json({ type: "youtube", externalId: asset.externalId });
  }

  if (asset.provider === "bunny") {
    if (!asset.externalId) return json({ error: "Asset has no Bunny video ID" }, 500);
    const { embedUrl } = getBunnyEmbedUrl({ videoId: asset.externalId });
    return json({ type: "bunny_embed", url: embedUrl });
  }

  if (asset.provider === "r2") {
    if (!asset.storageKey) return json({ error: "Asset has no storage key" }, 500);

    const expirySeconds =
      asset.type === "video_file" && !asset.downloadable
        ? Math.min(
            asset.durationSeconds != null
              ? asset.durationSeconds * 2
              : DEFAULT_VIDEO_EXPIRY_SECONDS,
            MAX_VIDEO_EXPIRY_SECONDS,
          )
        : DOCUMENT_EXPIRY_SECONDS;

    const url = await getDownloadUrl({
      storageKey: asset.storageKey,
      disposition: asset.downloadable ? "attachment" : "inline",
      fileName: asset.fileName ?? undefined,
      expirySeconds,
    });
    return json({ type: asset.downloadable ? "download" : "inline", url });
  }

  return json({ error: "Unsupported provider" }, 500);
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ lessonId: string; assetId: string }> },
) {
  let response: Response;
  try {
    response = await handle(req, context);
  } catch (error) {
    // Reported with area=deliver by safeError (the alert rule's filter).
    return routeError(error, "lessons: deliver asset", 500, undefined, { area: "deliver" });
  }
  // Deliberate 5xx answers (e.g. an asset row with no storage key) aren't
  // exceptions; report them under the same tag.
  if (response.status >= 500) {
    const { lessonId, assetId } = await context.params;
    captureEvent("Lesson delivery returned 5xx", { area: "deliver", status: String(response.status) }, {
      extra: { lessonId, assetId },
    });
  }
  return response;
}
