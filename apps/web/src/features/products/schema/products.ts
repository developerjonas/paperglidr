import { productStatuses } from "@/drizzle/schema";
import { z } from "zod";
import { imageHostErrorMessage, isAllowedImageUrl } from "@/lib/imageHosts";

export const productSchema = z.object({
  name: z.string().min(1, "Required"),
  priceInRupees: z.number().int().nonnegative(),
  description: z.string().min(1, "Required"),
  imageUrl: z.string().refine(isAllowedImageUrl, imageHostErrorMessage),
  status: z.enum(productStatuses),
  categoryId: z.string().nullable().optional(),
  tagIds: z.array(z.string()).default([]),
  courseIds: z.array(z.string()).min(1, "At least one course is required"),
});
