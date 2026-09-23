// Product thumbnails and instructor photos. Shared by the upload field
// (fail fast) and the server actions (the real check).
import { fileSignatures } from "@/features/lessons/lib/uploadRules"

export const IMAGE_MAX_BYTES = 5 * 1024 * 1024

export const IMAGE_TYPES = {
  "image/jpeg": { extension: "jpg", looksLike: fileSignatures.isJpeg },
  "image/png": { extension: "png", looksLike: fileSignatures.isPng },
  "image/webp": { extension: "webp", looksLike: fileSignatures.isWebp },
} as const

export type ImageMimeType = keyof typeof IMAGE_TYPES
export const IMAGE_MIME_TYPES = Object.keys(IMAGE_TYPES) as ImageMimeType[]

export function isImageMimeType(value: string): value is ImageMimeType {
  return Object.hasOwn(IMAGE_TYPES, value)
}

export const imageUploadPurposes = ["product", "instructor"] as const
export type ImageUploadPurpose = (typeof imageUploadPurposes)[number]

export const IMAGE_RULES_TEXT = "JPEG, PNG or WebP, up to 5 MB."
