// What creators may upload as lesson content. Shared by the upload UI (to
// fail fast) and the server actions (the real check).
import type { AssetRole, AssetType } from "@/drizzle/schema/lessonAsset"

const MB = 1024 * 1024
const GB = 1024 * MB

export type UploadRule = {
  assetType: AssetType
  maxBytes: number
  label: string
  // File-signature check on the first bytes actually stored in R2.
  looksLike: (prefix: Uint8Array) => boolean
}

const ascii = (b: Uint8Array, start: number, end: number) =>
  String.fromCharCode(...b.subarray(start, end))
const isMp4 = (b: Uint8Array) => b.length >= 8 && ascii(b, 4, 8) === "ftyp"
const isPdf = (b: Uint8Array) => ascii(b, 0, 5) === "%PDF-"
const isJpeg = (b: Uint8Array) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff
const isPng = (b: Uint8Array) =>
  [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((byte, i) => b[i] === byte)
const isWebp = (b: Uint8Array) => ascii(b, 0, 4) === "RIFF" && ascii(b, 8, 12) === "WEBP"

const RULES: Record<string, UploadRule> = {
  "video/mp4": { assetType: "video_file", maxBytes: 2 * GB, label: "MP4 video", looksLike: isMp4 },
  "application/pdf": { assetType: "pdf", maxBytes: 100 * MB, label: "PDF", looksLike: isPdf },
  "image/jpeg": { assetType: "image", maxBytes: 10 * MB, label: "JPEG image", looksLike: isJpeg },
  "image/png": { assetType: "image", maxBytes: 10 * MB, label: "PNG image", looksLike: isPng },
  "image/webp": { assetType: "image", maxBytes: 10 * MB, label: "WebP image", looksLike: isWebp },
}

// Primary = what the lesson player shows. Attachments = downloadable extras.
export const ALLOWED_MIME_TYPES: Record<AssetRole, readonly string[]> = {
  primary: ["video/mp4", "application/pdf"],
  attachment: ["application/pdf", "image/jpeg", "image/png", "image/webp"],
}

export function getUploadRule(role: AssetRole, mimeType: string): UploadRule | null {
  return ALLOWED_MIME_TYPES[role].includes(mimeType) ? (RULES[mimeType] ?? null) : null
}

export function formatBytes(bytes: number) {
  return bytes >= GB ? `${bytes / GB} GB` : `${Math.round(bytes / MB)} MB`
}

/** Shown to creators in the upload UI. */
export const VIDEO_ENCODING_GUIDANCE =
  "Upload MP4 video encoded with H.264 (AAC audio) at 720p, around 1.5–2.5 Mbps, up to 2 GB. That keeps lessons watchable on mobile data; higher bitrates make students buffer and don't look better on a phone."

export const SIGNATURE_BYTES = 16

/** Byte signatures of the file types above (also used by image uploads). */
export const fileSignatures = { isMp4, isPdf, isJpeg, isPng, isWebp }
