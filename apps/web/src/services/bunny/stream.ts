import "server-only";
import crypto from "crypto";
import { env } from "@/data/env/server";

/**
 * Bunny Stream: where paid lesson video lives (free lessons use YouTube or
 * Vimeo links). Creators upload straight to Bunny over TUS with a
 * signature we issue (the API key never leaves the server); Bunny encodes
 * to adaptive HLS; students watch in Bunny's player through a short-lived
 * signed embed link, issued only after the access check. Docs:
 * https://docs.bunny.net/stream/tus-resumable-uploads.md,
 * /stream/token-authentication.md, /stream/webhooks.md, and the API spec
 * at https://video.bunnycdn.com/openapi/bunnynet-video-api.public.json.
 */

const API_BASE = "https://video.bunnycdn.com";
export const BUNNY_TUS_ENDPOINT = "https://video.bunnycdn.com/tusupload";
const PLAYER_BASE = "https://player.mediadelivery.net/embed";

export type BunnyConfig = {
  libraryId: string;
  apiKey: string;
  tokenAuthKey: string;
  readOnlyApiKey: string | undefined;
};

/** Null until the library's ID, API key and token key are all set. */
export function getBunnyConfig(): BunnyConfig | null {
  const { BUNNY_STREAM_LIBRARY_ID, BUNNY_STREAM_API_KEY, BUNNY_STREAM_TOKEN_AUTH_KEY } = env;
  if (!BUNNY_STREAM_LIBRARY_ID || !BUNNY_STREAM_API_KEY || !BUNNY_STREAM_TOKEN_AUTH_KEY) return null;
  return {
    libraryId: BUNNY_STREAM_LIBRARY_ID,
    apiKey: BUNNY_STREAM_API_KEY,
    tokenAuthKey: BUNNY_STREAM_TOKEN_AUTH_KEY,
    readOnlyApiKey: env.BUNNY_STREAM_READ_ONLY_API_KEY,
  };
}

/** Playback needs only the library ID and the token key (not the API key). */
export function canPlayBunnyVideos() {
  return Boolean(env.BUNNY_STREAM_LIBRARY_ID && env.BUNNY_STREAM_TOKEN_AUTH_KEY);
}

function requireConfig(): BunnyConfig {
  const config = getBunnyConfig();
  if (config == null) throw new Error("Bunny Stream isn't configured (BUNNY_STREAM_* env vars)");
  return config;
}

const sha256Hex = (value: string) => crypto.createHash("sha256").update(value).digest("hex");

/**
 * VideoModelStatus from Bunny's API spec. (Webhook payloads use a
 * different numbering; we never trust those, we re-read the video.)
 */
export const BUNNY_VIDEO_STATUS = {
  created: 0,
  uploaded: 1,
  processing: 2,
  transcoding: 3,
  finished: 4,
  error: 5,
  uploadFailed: 6,
} as const;

export type BunnyVideo = {
  guid: string;
  status: number;
  /** Seconds. */
  length: number;
  /** Bytes stored, all encoded resolutions included. */
  storageSize: number;
  /** e.g. "360p,720p": resolutions that finished encoding and can play. */
  availableResolutions: string | null;
  encodeProgress: number;
};

/** What a Bunny video means for its lesson asset. */
export function bunnyVideoState(video: Pick<BunnyVideo, "status" | "availableResolutions">): "ready" | "failed" | "pending" {
  if (video.status === BUNNY_VIDEO_STATUS.finished) return "ready";
  if (video.status === BUNNY_VIDEO_STATUS.error || video.status === BUNNY_VIDEO_STATUS.uploadFailed) return "failed";
  // Playable as soon as the first resolution is done, before the rest finish.
  if (video.status === BUNNY_VIDEO_STATUS.transcoding && video.availableResolutions?.trim()) return "ready";
  return "pending";
}

type Fetch = typeof fetch;

async function call<T>(path: string, init: RequestInit, fetchImpl: Fetch): Promise<T | null> {
  const { libraryId, apiKey } = requireConfig();
  const res = await fetchImpl(`${API_BASE}/library/${encodeURIComponent(libraryId)}${path}`, {
    ...init,
    headers: { AccessKey: apiKey, Accept: "application/json", "Content-Type": "application/json", ...init.headers },
    signal: AbortSignal.timeout(15_000),
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Bunny Stream ${init.method ?? "GET"} ${path} failed: ${res.status}`);
  const text = await res.text();
  return text ? (JSON.parse(text) as T) : (null as T | null);
}

/** Creates an empty video to upload into. */
export async function createBunnyVideo(title: string, fetchImpl: Fetch = fetch) {
  const video = await call<BunnyVideo>("/videos", { method: "POST", body: JSON.stringify({ title: title.slice(0, 200) }) }, fetchImpl);
  if (video?.guid == null) throw new Error("Bunny Stream didn't return a video id");
  return video;
}

/** Null if the video doesn't exist (anymore). */
export async function getBunnyVideo(videoId: string, fetchImpl: Fetch = fetch) {
  return call<BunnyVideo>(`/videos/${encodeURIComponent(videoId)}`, { method: "GET" }, fetchImpl);
}

/** Deleting a video that's already gone counts as done. */
export async function deleteBunnyVideo(videoId: string, fetchImpl: Fetch = fetch) {
  await call<unknown>(`/videos/${encodeURIComponent(videoId)}`, { method: "DELETE" }, fetchImpl);
}

/**
 * Headers for one TUS upload into one video:
 * SHA256(library_id + api_key + expiration_time + video_id).
 */
export function bunnyUploadCredentials(videoId: string, validForSeconds = 24 * 60 * 60) {
  const { libraryId, apiKey } = requireConfig();
  const expires = Math.floor(Date.now() / 1000) + validForSeconds;
  return {
    endpoint: BUNNY_TUS_ENDPOINT,
    libraryId,
    videoId,
    expires,
    signature: sha256Hex(`${libraryId}${apiKey}${expires}${videoId}`),
  };
}

/**
 * The player link for one viewer: SHA256_HEX(token_key + video_id +
 * expires). With Token Authentication on in the library, nothing plays
 * without it, and it stops loading after `expires`.
 */
export function bunnyEmbedUrl(videoId: string, validForSeconds: number) {
  const libraryId = env.BUNNY_STREAM_LIBRARY_ID;
  const tokenAuthKey = env.BUNNY_STREAM_TOKEN_AUTH_KEY;
  if (!libraryId || !tokenAuthKey) throw new Error("Bunny Stream playback isn't configured");
  const expires = Math.floor(Date.now() / 1000) + validForSeconds;
  const token = sha256Hex(`${tokenAuthKey}${videoId}${expires}`);
  const url = new URL(`${PLAYER_BASE}/${encodeURIComponent(libraryId)}/${encodeURIComponent(videoId)}`);
  url.searchParams.set("token", token);
  url.searchParams.set("expires", String(expires));
  // Nothing downloads until the viewer presses play (bandwidth is billed),
  // and the player remembers where they stopped.
  url.searchParams.set("autoplay", "false");
  url.searchParams.set("preload", "false");
  url.searchParams.set("rememberPosition", "true");
  return { url: url.toString(), expires };
}

/**
 * A webhook is genuine when X-BunnyStream-Signature is the lowercase hex
 * HMAC-SHA256 of the exact raw body, keyed with the library's Read-Only
 * API key (signature version v1).
 */
export function verifyBunnyWebhook(rawBody: string, headers: Headers) {
  const secret = getBunnyConfig()?.readOnlyApiKey;
  if (!secret) return false;
  if (headers.get("x-bunnystream-signature-version") !== "v1") return false;
  if (headers.get("x-bunnystream-signature-algorithm") !== "hmac-sha256") return false;
  const given = headers.get("x-bunnystream-signature") ?? "";
  const expected = crypto.createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");
  if (given.length !== expected.length || !/^[0-9a-f]+$/.test(given)) return false;
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(given));
}
