import { z } from "zod"

// Fails fast on garbage route params before they ever hit the DB
export const certificateCodeSchema = z
  .string()
  .regex(/^CERT-[A-Z0-9]{10}$/, "Invalid certificate code format")

export const revokeCertificateSchema = z.object({
  reason: z.string().min(1, "A reason is required to revoke a certificate"),
})
