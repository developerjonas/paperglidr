import { z } from "zod";
import { imageHostErrorMessage, isAllowedImageUrl } from "@/lib/imageHosts";

export const productSchema = z.object({
  name: z.string().min(1, "Required"),
  priceInRupees: z.number().int().nonnegative(),
  description: z.string().min(1, "Required"),
  imageUrl: z
    .string()
    .min(1, "Upload a thumbnail")
    .refine(isAllowedImageUrl, imageHostErrorMessage),
  // What the creator asks for: keep it private, or publish. "public" from a
  // creator means "submit for review" (pending_review); only an admin's
  // approval makes it live. See actions/products.ts.
  status: z.enum(["private", "public"]),
  categoryId: z.string().nullable().optional(),
  tagIds: z.array(z.string()).default([]),
  courseIds: z.array(z.string()).min(1, "At least one course is required"),
});
