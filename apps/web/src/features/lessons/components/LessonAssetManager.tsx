"use client";

import { useEffect, useRef, useState } from "react";
import * as tus from "tus-js-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { actionToast } from "@/hooks/use-toast";
import {
  requestLessonAssetUploadUrl,
  confirmLessonAssetUpload,
  requestLessonVideoUpload,
  confirmLessonVideoUpload,
  getLessonStorageUsage,
  setLessonEmbedVideo,
  removeLessonAsset,
  listLessonAssetsForEditor,
} from "../actions/lessonAssets";
import {
  ALLOWED_MIME_TYPES,
  VIDEO_ENCODING_GUIDANCE,
  VIDEO_UPLOAD,
  formatBytes,
  getUploadRule,
  isAllowedVideoUpload,
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
  status: "pending" | "ready" | "failed";
};

type VideoUploadCredentials = {
  endpoint: string;
  libraryId: string;
  videoId: string;
  expires: number;
  signature: string;
};

// A video upload in progress survives a reload: choosing the same file
// again continues it (TUS resumes from the last byte Bunny received).
const resumeKey = (lessonId: string, file: File) =>
  `chiyali:video-upload:${lessonId}:${file.name}:${file.size}:${file.lastModified}`;

function readResume(key: string): { assetId: string; upload: VideoUploadCredentials } | null {
  try {
    const saved = JSON.parse(localStorage.getItem(key) ?? "null");
    // Keep a margin: the signature must outlive the rest of the upload.
    return saved && saved.upload.expires * 1000 > Date.now() + 2 * 60 * 60 * 1000 ? saved : null;
  } catch {
    return null;
  }
}

function forgetResume(key: string) {
  try {
    localStorage.removeItem(key);
  } catch {}
}

const isHostedVideo = (asset: LessonAsset) =>
  asset.provider === "bunny" || (asset.provider === "r2" && asset.type === "video_file");

/** Free (a ₹0 product), paid (a paid product, live or in review) or draft (not on sale). */
export type CourseVideoState = "free" | "paid" | "draft";

/**
 * Step 2 of the lesson form: the lesson's content. Previews and free
 * courses take a YouTube or Vimeo link for their video; paid courses take
 * an uploaded video (Bunny Stream); a course that isn't on sale yet can use either (checked
 * when it goes on sale). Any lesson can use a PDF instead and have
 * attachments. The server enforces all of this (lib/freeTier.ts); this only
 * shows the right controls.
 */
export function LessonAssetManager({
  lessonId,
  courseVideoState,
  isPreview,
}: {
  lessonId: string;
  courseVideoState: CourseVideoState;
  isPreview: boolean;
}) {
  // Same rule as videoRulesFor in lib/freeTier.ts.
  const freeTier = isPreview || courseVideoState === "free";
  const embedsAllowed = freeTier || courseVideoState !== "paid";
  const [assets, setAssets] = useState<LessonAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [embedUrl, setEmbedUrl] = useState("");
  const [videoProgress, setVideoProgress] = useState<{ fileName: string; percent: number } | null>(null);
  const [storage, setStorage] = useState<{ usedBytes: number; limitBytes: number } | null>(null);
  const activeUpload = useRef<tus.Upload | null>(null);
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

  async function refresh({ quiet = false } = {}) {
    if (!quiet) setLoading(true);
    const [data, usage] = await Promise.all([
      listLessonAssetsForEditor(lessonId),
      getLessonStorageUsage(lessonId).catch(() => null),
    ]);
    setAssets(data as LessonAsset[]);
    setStorage(usage);
    if (!quiet) setLoading(false);
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonId]);

  // While a video is encoding, check back every 15 seconds.
  const processing = assets.some((a) => a.provider === "bunny" && a.status === "pending");
  useEffect(() => {
    if (!processing || videoProgress != null) return;
    const timer = setInterval(() => void refresh({ quiet: true }), 15_000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [processing, videoProgress != null, lessonId]);

  // Leaving the page mid-upload stops it (it can be resumed later).
  useEffect(() => () => void activeUpload.current?.abort(), []);

  async function handleVideoUpload(file: File) {
    if (!isAllowedVideoUpload(file.type)) {
      actionToast({ actionData: { error: true, message: "Upload an MP4, MOV, WebM or MKV video." } });
      return;
    }
    if (file.size > VIDEO_UPLOAD.maxBytes) {
      actionToast({
        actionData: { error: true, message: `Videos can be at most ${formatBytes(VIDEO_UPLOAD.maxBytes)}.` },
      });
      return;
    }

    const key = resumeKey(lessonId, file);
    setUploading(true);
    setVideoProgress({ fileName: file.name, percent: 0 });
    try {
      let session = readResume(key);
      if (session == null) {
        const requested = await requestLessonVideoUpload({
          lessonId,
          fileName: file.name,
          mimeType: file.type,
          fileSizeBytes: file.size,
        });
        if (requested.error) throw new Error(requested.message);
        session = { assetId: requested.assetId, upload: requested.upload };
        try {
          localStorage.setItem(key, JSON.stringify(session));
        } catch {}
        await refresh({ quiet: true });
      }
      const { assetId, upload: creds } = session;

      await new Promise<void>((resolve, reject) => {
        const upload = new tus.Upload(file, {
          endpoint: creds.endpoint,
          retryDelays: [0, 3000, 5000, 10000, 20000, 60000, 60000],
          chunkSize: 50 * 1024 * 1024,
          headers: {
            AuthorizationSignature: creds.signature,
            AuthorizationExpire: String(creds.expires),
            VideoId: creds.videoId,
            LibraryId: creds.libraryId,
          },
          metadata: { filetype: file.type, title: file.name },
          // One upload per Bunny video, so the resume fingerprint includes it.
          fingerprint: async (f) => `bunny-${creds.videoId}-${(f as File).size}`,
          removeFingerprintOnSuccess: true,
          onProgress: (sent, total) =>
            setVideoProgress({ fileName: file.name, percent: total ? Math.floor((sent / total) * 100) : 0 }),
          onSuccess: () => resolve(),
          onError: (error) => reject(error),
        });
        activeUpload.current = upload;
        void upload.findPreviousUploads().then((previous) => {
          if (previous[0]) upload.resumeFromPreviousUpload(previous[0]);
          upload.start();
        });
      });
      activeUpload.current = null;
      forgetResume(key);

      const confirmed = await confirmLessonVideoUpload(assetId, lessonId);
      if (confirmed.error) throw new Error(confirmed.message);
      actionToast({
        actionData: {
          error: false,
          message:
            confirmed.status === "ready"
              ? "Video ready"
              : "Uploaded. Processing for streaming: this usually takes a few minutes.",
        },
      });
    } catch (err) {
      actionToast({
        actionData: {
          error: true,
          message:
            err instanceof Error && !(err instanceof tus.DetailedError)
              ? err.message
              : "The upload was interrupted. Choose the same file again to continue where it stopped.",
        },
      });
    } finally {
      activeUpload.current = null;
      setVideoProgress(null);
      setUploading(false);
      await refresh({ quiet: true });
    }
  }

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
            role === "attachment"
              ? "Attachments must be a PDF, JPEG, PNG or WebP file."
              : "Upload a PDF here.",
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
      const requested = await requestLessonAssetUploadUrl({
        lessonId,
        fileName: file.name,
        mimeType: file.type,
        fileSizeBytes: file.size,
        role,
        downloadable,
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
            : embedsAllowed
              ? `This course isn't on sale yet. If it will be free, use ${EMBED_PROVIDER_LABELS} links; if you'll sell it, upload videos (only free preview lessons can use links in a paid course).`
              : `Upload the lesson's video or a PDF. Paid lessons can't use ${EMBED_PROVIDER_LABELS} links — anyone with the link could watch them.`}{" "}
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
                  {asset.status === "pending" && asset.provider !== "bunny" ? " · upload not finished" : ""}
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
              {asset.provider === "bunny" && asset.status === "pending" ? (
                <p className="text-muted-foreground" role="status">
                  Processing for streaming… This usually takes a few minutes; you can leave this page. Students see the
                  lesson&apos;s previous video until it&apos;s ready.
                </p>
              ) : asset.provider === "bunny" && asset.status === "failed" ? (
                <p className="text-destructive">
                  This video couldn&apos;t be processed. Check the file plays on your computer, then upload it again.
                </p>
              ) : null}
              {freeTier && isHostedVideo(asset) ? (
                <p className="text-destructive">
                  This uploaded video won&apos;t play on a free lesson. Replace
                  it with a {EMBED_PROVIDER_LABELS} link.
                </p>
              ) : !embedsAllowed && isEmbedProvider(asset.provider) ? (
                <p className="text-destructive">
                  This link won&apos;t play on a paid lesson. Replace it with an
                  uploaded video.
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      {embedsAllowed && (
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
        </div>
      )}

      {freeTier ? (
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Or upload a PDF instead</label>
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
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-2">
            <label htmlFor={`video-${lessonId}`} className="text-sm font-medium">
              {embedsAllowed ? "Or upload the lesson video" : "Upload the lesson video"}
            </label>
            <p className="text-sm text-muted-foreground">
              {VIDEO_ENCODING_GUIDANCE} Uploaded videos are protected: only students who bought the course can watch them.
            </p>
            <Input
              id={`video-${lessonId}`}
              type="file"
              accept={`${VIDEO_UPLOAD.mimeTypes.join(",")},${VIDEO_UPLOAD.extensions}`}
              disabled={uploading}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleVideoUpload(file);
                e.target.value = "";
              }}
            />
            {videoProgress != null ? (
              <div className="flex flex-col gap-1" role="status" aria-live="polite">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span className="truncate">Uploading {videoProgress.fileName}</span>
                  <span>{videoProgress.percent}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div className="h-full bg-primary transition-all" style={{ width: `${videoProgress.percent}%` }} />
                </div>
                <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                  <span>Keep this page open. If the connection drops, choose the same file again to continue.</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      void activeUpload.current?.abort();
                      activeUpload.current = null;
                      setVideoProgress(null);
                      setUploading(false);
                    }}
                  >
                    Pause
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor={`pdf-${lessonId}`} className="text-sm font-medium">
              Or use a PDF as the lesson content
            </label>
            <Input
              id={`pdf-${lessonId}`}
              type="file"
              accept="application/pdf"
              disabled={uploading}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleUpload(file, "primary", false);
                e.target.value = "";
              }}
            />
            <p className="text-sm text-muted-foreground">PDFs up to 100 MB.</p>
          </div>
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

      {storage != null ? <StorageMeter {...storage} /> : null}
    </div>
  );
}

/** "1.2 GB of 5 GB used": the creator's upload storage (all their courses). */
function StorageMeter({ usedBytes, limitBytes }: { usedBytes: number; limitBytes: number }) {
  const percent = Math.min(100, Math.round((usedBytes / limitBytes) * 100));
  return (
    <div className="flex flex-col gap-1 border-t pt-3">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>
          Your storage: {formatBytes(usedBytes)} of {formatBytes(limitBytes)} used (all your courses)
        </span>
        <span>{percent}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden>
        <div className={percent >= 90 ? "h-full bg-destructive" : "h-full bg-primary"} style={{ width: `${percent}%` }} />
      </div>
      {percent >= 90 ? (
        <p className="text-xs text-muted-foreground">
          Almost full. Remove videos you no longer use, or contact support for more space.
        </p>
      ) : null}
    </div>
  );
}

function formatStart(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = String(seconds % 60).padStart(2, "0");
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${s}` : `${m}:${s}`;
}
