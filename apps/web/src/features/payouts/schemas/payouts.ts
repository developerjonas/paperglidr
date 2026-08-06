import { z } from "zod"

export const payoutRequestSchema = z.object({
  amountInRupees: z.coerce.number().positive(),
  bankDetailsSnapshot: z.string().min(1, "Bank details are required"),
})
