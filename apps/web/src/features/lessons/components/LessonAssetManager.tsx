"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { actionToast } from "@/hooks/use-toast";
import {
  requestLessonAssetUploadUrl,
  confirmLessonAssetUpload,
  setLessonEmbedVideo,
  removeLessonAsset,
  listLessonAssetsForEditor,
} from "../actions/lessonAssets";
import {
  ALLOWED_MIME_TYPES,
  VIDEO_ENCODING_GUIDANCE,
  formatBytes,
  getUploadRule,
} from "../lib/uploadRules";
import { INVALID_EMBED_MESSAGE, parseEmbedUrl } from "@repo/video-embeds";

const youtubeAllowedFor = (lessonStatus: string) => lessonStatus === "preview";

// Matches the shape returned by getLessonAssetsForLesson (db/lessonAssets.ts) —
// keep in sync if that query's columns change.
type LessonAsset = {
  id: string;
  type: string;
  provider: string;
  role: "primary" | "attachment";
  fileName: string | null;
  downloadable: boolean;
  status: "pending" | "ready";
};

export function LessonAssetManager({
  lessonId,
  lessonStatus,
}: {
  lessonId: string;
  lessonStatus: string | null;
}) {
  const [assets, setAssets] = useState<LessonAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState("");

  async function handleSetYouTube() {
    if (parseEmbedUrl(youtubeUrl) == null) {
      actionToast({
        actionData: { error: true, message: INVALID_EMBED_MESSAGE },
      });
      return;
    }
    setUploading(true);
    const result = await setLessonEmbedVideo(lessonId, youtubeUrl);
    actionToast({ actionData: result });
    setUploading(false);
    if (!result.error) {
      setYoutubeUrl("");
      await refresh();
    }
  }

  async function refresh() {
    setLoading(true);
    const data = await listLessonAssetsForEditor(lessonId);
    setAssets(data as LessonAsset[]);
    setLoading(false);
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonId]);

  async function handleUpload(
    file: File,
    role: "primary" | "attachment",
    downloadable: boolean,
  ) {
    // Fail fast in the browser; the server checks all of this again.
    const rule = getUploadRule(role, file.type);
    if (rule == null) {
      actionToast({
        actionData: {
          error: true,
          message:
            role === "primary"
              ? "Lesson content must be an MP4 video or a PDF."
              : "Attachments must be a PDF, JPEG, PNG or WebP file.",
        },
      });
      return;
    }
    if (file.size > rule.maxBytes) {
      actionToast({
        actionData: {
          error: true,
          message: `${rule.label} files can be at most ${formatBytes(rule.maxBytes)}.`,
        },
      });
      return;
    }

    setUploading(true);
    try {
      const durationSeconds =
        rule.assetType === "video_file"
          ? await getVideoDurationSeconds(file)
          : null;

      const requested = await requestLessonAssetUploadUrl({
        lessonId,
        fileName: file.name,
        mimeType: file.type,
        fileSizeBytes: file.size,
        role,
        downloadable,
        durationSeconds,
      });
      if (requested.error) throw new Error(requested.message);

      // Content-Type and Content-Length are part of the signature.
      const putRes = await fetch(requested.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!putRes.ok) throw new Error("Upload to storage failed");

      const confirmed = await confirmLessonAssetUpload(
        requested.assetId,
        lessonId,
      );
      if (confirmed.error) throw new Error(confirmed.message);

      actionToast({ actionData: { error: false, message: "Uploaded" } });
      await refresh();
    } catch (err) {
      actionToast({
        actionData: {
          error: true,
          message: err instanceof Error ? err.message : "Upload failed",
        },
      });
    } finally {
      setUploading(false);
    }
  }

  async function handleRemove(assetId: string) {
    const data = await removeLessonAsset(assetId, lessonId);
    actionToast({
      actionData: {
        error: data == null,
        message: data == null ? "Failed to remove" : "Removed",
      },
    });
    await refresh();
  }

  return (
    <div className="flex flex-col gap-4 border rounded-md p-4">
      <div>
        <h3 className="font-medium">Lesson content</h3>
        <p className="text-sm text-muted-foreground">
          Upload the main PDF or video for this lesson, and optionally attach
          extra downloadable files (slides, worksheets).
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading assets…</p>
      ) : assets.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No content uploaded yet.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {assets.map((asset) => (
            <li
              key={asset.id}
              className="flex items-center justify-between text-sm border rounded px-3 py-2"
            >
              <span>
                <strong>{asset.role}</strong> · {asset.type} ·{" "}
                {asset.fileName ?? "(unnamed)"}
                {asset.downloadable ? " · downloadable" : ""}
                {asset.status === "pending" ? " · upload not finished" : ""}
              </span>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => handleRemove(asset.id)}
              >
                Remove
              </Button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">
          Upload primary content (MP4 video or PDF)
        </label>
        <p className="text-sm text-muted-foreground">
          {VIDEO_ENCODING_GUIDANCE} PDFs up to 100 MB.
        </p>
        <Input
          type="file"
          accept={ALLOWED_MIME_TYPES.primary.join(",")}
          disabled={uploading}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleUpload(file, "primary", false);
            e.target.value = "";
          }}
        />
      </div>

      {lessonStatus != null && youtubeAllowedFor(lessonStatus) ? (
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">
            Or use a YouTube video (free previews only)
          </label>
          <div className="flex gap-2">
            <Input
              placeholder="https://www.youtube.com/watch?v=…"
              value={youtubeUrl}
              disabled={uploading}
              onChange={(e) => setYoutubeUrl(e.target.value)}
            />
            <Button
              type="button"
              variant="outline"
              disabled={uploading || !youtubeUrl.trim()}
              onClick={handleSetYouTube}
            >
              Use video
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Replaces the lesson&apos;s current video or PDF.
          </p>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          YouTube videos can be used on free preview lessons only; paid
          lessons need an uploaded MP4.
        </p>
      )}

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">
          Add downloadable attachment (optional)
        </label>
        <p className="text-sm text-muted-foreground">
          PDF, JPEG, PNG or WebP. PDFs up to 100 MB, images up to 10 MB.
        </p>
        <Input
          type="file"
          accept={ALLOWED_MIME_TYPES.attachment.join(",")}
          disabled={uploading}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleUpload(file, "attachment", true);
            e.target.value = "";
          }}
        />
      </div>
    </div>
  );
}

async function getVideoDurationSeconds(file: File): Promise<number | null> {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(video.src);
      resolve(
        Number.isFinite(video.duration) ? Math.round(video.duration) : null,
      );
    };
    video.onerror = () => {
      URL.revokeObjectURL(video.src);
      resolve(null);
    };
    video.src = URL.createObjectURL(file);
  });
}
