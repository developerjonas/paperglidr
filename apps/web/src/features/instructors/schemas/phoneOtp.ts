import { z } from "zod"

export const phoneNumberSchema = z
  .string()
  .regex(/^\+977\d{10}$/, "Enter a valid number in +977XXXXXXXXXX format")

export const requestOtpSchema = z.object({
  phoneNumber: phoneNumberSchema,
})

export const verifyOtpSchema = z.object({
  code: z.string().length(6, "Enter the 6-digit code"),
})

export type RequestOtpValues = z.infer<typeof requestOtpSchema>
export type VerifyOtpValues = z.infer<typeof verifyOtpSchema>
