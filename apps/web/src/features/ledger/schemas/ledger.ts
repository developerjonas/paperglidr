import { z } from "zod";

// Not wired to anything yet — only useful if you later build an admin UI
// to override the flat commission rate per instructor or per course.
export const commissionOverrideSchema = z.object({
  rate: z.number().min(0).max(1),
});
