import { z } from "zod";
import { assetTypes, assetRoles } from "@/drizzle/schema/lessonAsset";

export const requestLessonAssetUploadSchema = z.object({
  lessonId: z.string().uuid(),
  fileName: z.string().min(1).max(255),
  mimeType: z.string().min(1),
  fileSizeBytes: z.number().int().positive(),
  role: z.enum(assetRoles).default("primary"),
  downloadable: z.boolean().default(false),
  durationSeconds: z.number().int().positive().nullable().optional(),
});

export type RequestLessonAssetUploadInput = z.infer<
  typeof requestLessonAssetUploadSchema
>;

// Which types and sizes are allowed lives in ../lib/uploadRules.ts.

// Re-export for convenience so callers don't need two import paths.
export { assetTypes, assetRoles };
