import { z } from "zod";

export const searchQuerySchema = z.object({
  q: z.string().max(100).optional(),
  categoryId: z.string().uuid().optional(),
  tagIds: z.array(z.string().uuid()).optional(),
  minPrice: z.number().int().nonnegative().optional(),
  maxPrice: z.number().int().nonnegative().optional(),
  minRating: z.number().min(0).max(5).optional(),
  sort: z
    .enum(["relevance", "rating", "newest", "price_asc", "price_desc"])
    .default("relevance"),
  page: z.number().int().positive().default(1),
});

export type SearchQuery = z.infer<typeof searchQuerySchema>;
