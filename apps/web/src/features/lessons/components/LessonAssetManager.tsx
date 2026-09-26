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
import {
  EMBED_PROVIDER_LABELS,
  EMBED_PROVIDERS,
  INVALID_EMBED_MESSAGE,
  buildEmbedUrl,
  isEmbedProvider,
  parseEmbedUrl,
} from "@repo/video-embeds";

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

const isHostedVideo = (asset: LessonAsset) =>
  asset.provider === "bunny" || (asset.provider === "r2" && asset.type === "video_file");

/**
 * Step 2 of the lesson form: the lesson's content. Free-tier lessons
 * (previews, and every lesson of a free course) take a YouTube or Vimeo
 * link for their video; paid lessons take an uploaded MP4. Either can use a
 * PDF instead, and both can have attachments. The server enforces all of
 * this (actions/lessonAssets.ts); this only shows the right controls.
 */
export function LessonAssetManager({
  lessonId,
  freeTier,
}: {
  lessonId: string;
  freeTier: boolean;
}) {
  const [assets, setAssets] = useState<LessonAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [embedUrl, setEmbedUrl] = useState("");
  const embed = embedUrl.trim() ? parseEmbedUrl(embedUrl) : null;

  async function handleSetEmbed() {
    if (embed == null) {
      actionToast({ actionData: { error: true, message: INVALID_EMBED_MESSAGE } });
      return;
    }
    setUploading(true);
    const result = await setLessonEmbedVideo(lessonId, embedUrl);
    actionToast({ actionData: result });
    setUploading(false);
    if (!result.error) {
      setEmbedUrl("");
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
    if (rule == null || (freeTier && rule.assetType === "video_file")) {
      actionToast({
        actionData: {
          error: true,
          message:
            role === "attachment"
              ? "Attachments must be a PDF, JPEG, PNG or WebP file."
              : freeTier
                ? `Upload a PDF, or use a ${EMBED_PROVIDER_LABELS} link for video.`
                : "Lesson content must be an MP4 video or a PDF.",
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
          {freeTier
            ? `This lesson is free to watch (a preview, or in a free course), so its video is a ${EMBED_PROVIDER_LABELS} link. Uploaded video is for paid lessons.`
            : `Upload the lesson's MP4 video or PDF. Paid lessons can't use ${EMBED_PROVIDER_LABELS} links — anyone with the link could watch them.`}{" "}
          You can also attach downloadable files (slides, worksheets).
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
              className="flex flex-col gap-1 text-sm border rounded px-3 py-2"
            >
              <div className="flex items-center justify-between gap-2">
                <span>
                  <strong>{asset.role}</strong> ·{" "}
                  {isEmbedProvider(asset.provider)
                    ? EMBED_PROVIDERS[asset.provider].label
                    : asset.type}{" "}
                  · {asset.fileName ?? "(unnamed)"}
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
              </div>
              {freeTier && isHostedVideo(asset) ? (
                <p className="text-destructive">
                  This uploaded video won&apos;t play on a free lesson. Replace
                  it with a {EMBED_PROVIDER_LABELS} link.
                </p>
              ) : !freeTier && isEmbedProvider(asset.provider) ? (
                <p className="text-destructive">
                  This link won&apos;t play on a paid lesson. Replace it with an
                  uploaded MP4.
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      {freeTier ? (
        <div className="flex flex-col gap-2">
          <label htmlFor={`embed-${lessonId}`} className="text-sm font-medium">
            Embed URL ({EMBED_PROVIDER_LABELS})
          </label>
          <div className="flex gap-2">
            <Input
              id={`embed-${lessonId}`}
              placeholder="https://www.youtube.com/watch?v=… or https://vimeo.com/…"
              value={embedUrl}
              disabled={uploading}
              aria-invalid={embedUrl.trim() !== "" && embed == null}
              aria-describedby={`embed-${lessonId}-hint`}
              onChange={(e) => setEmbedUrl(e.target.value)}
            />
            <Button
              type="button"
              variant="outline"
              disabled={uploading || embed == null}
              onClick={handleSetEmbed}
            >
              Use video
            </Button>
          </div>
          <p
            id={`embed-${lessonId}-hint`}
            className={
              embedUrl.trim() !== "" && embed == null
                ? "text-sm text-destructive"
                : "text-sm text-muted-foreground"
            }
          >
            {embedUrl.trim() === ""
              ? "Paste a video link. Replaces the lesson's current video or PDF."
              : embed == null
                ? INVALID_EMBED_MESSAGE
                : `${EMBED_PROVIDERS[embed.provider].label} video${
                    embed.startSeconds ? `, starting at ${formatStart(embed.startSeconds)}` : ""
                  }. Check the preview, then choose “Use video”.`}
          </p>
          {embed != null ? (
            <div className="aspect-video w-full overflow-hidden rounded-md border bg-black">
              <iframe
                key={buildEmbedUrl(embed)}
                src={buildEmbedUrl(embed)}
                title="Video preview"
                className="h-full w-full"
                allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
                allowFullScreen
                referrerPolicy="strict-origin-when-cross-origin"
              />
            </div>
          ) : null}

          <label className="text-sm font-medium mt-2">Or upload a PDF instead</label>
          <Input
            type="file"
            accept="application/pdf"
            disabled={uploading}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleUpload(file, "primary", false);
              e.target.value = "";
            }}
          />
        </div>
      ) : (
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

function formatStart(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = String(seconds % 60).padStart(2, "0");
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${s}` : `${m}:${s}`;
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
