import { z } from "zod";
import { assetTypes, assetRoles } from "@/drizzle/schema/lessonAsset";

export const requestLessonAssetUploadSchema = z.object({
  lessonId: z.string().uuid(),
  fileName: z.string().min(1),
  mimeType: z.string().min(1),
  fileSizeBytes: z.number().positive(),
  role: z.enum(assetRoles).default("primary"),
  downloadable: z.boolean().default(false),
});

export type RequestLessonAssetUploadInput = z.infer<
  typeof requestLessonAssetUploadSchema
>;

// Shared helper — not itself a form schema, but keeps mime->type mapping
// in one place instead of duplicated between action + any future admin tool.
export function mimeTypeToAssetType(mimeType: string) {
  if (mimeType === "application/pdf") return "pdf" as const;
  if (mimeType.startsWith("video/")) return "video_file" as const;
  if (mimeType.startsWith("image/")) return "image" as const;
  if (mimeType.startsWith("audio/")) return "audio" as const;
  throw new Error(`Unsupported mime type: ${mimeType}`);
}

// Re-export for convenience so callers don't need two import paths.
export { assetTypes, assetRoles };
