import { z } from "zod"

export const reviewSchema = z.object({
  rating: z.number().int().min(1, "Rating is required").max(5),
  content: z.string().max(2000, "Keep it under 2000 characters").optional(),
})
