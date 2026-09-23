import { createEnv } from "@t3-oss/env-nextjs"
import { z } from "zod"

// Server-only variables. Public (NEXT_PUBLIC_*) variables live in
// ./client.ts — server code may import both.
//
// Payment gateway variables (ESEWA_*, KHALTI_*, FONEPAY_*) are deliberately
// NOT declared here: they will get their own validated config module in
// services/payments (GTM plan task 7).
export const env = createEnv({
  server: {
    // --- Database ---
    DB_PASSWORD: z.string().min(1),
    DB_USER: z.string().min(1),
    DB_NAME: z.string().min(1),
    DB_HOST: z.string().min(1),
    // "false" for local Postgres without TLS; anything else (or unset) = SSL on
    DB_SSL: z
      .enum(["true", "false"])
      .default("true")
      .transform(value => value === "true"),

    // --- Better Auth ---
    BETTER_AUTH_SECRET: z.string().min(1),
    BETTER_AUTH_URL: z.string().url(),
    GOOGLE_CLIENT_ID: z.string().min(1),
    GOOGLE_CLIENT_SECRET: z.string().min(1),
    // GitHub sign-in is registered only when both are set
    GITHUB_CLIENT_ID: z.string().min(1).optional(),
    GITHUB_CLIENT_SECRET: z.string().min(1).optional(),

    // --- R2 (object storage) ---
    R2_ACCESS_KEY_ID: z.string().min(1),
    R2_SECRET_ACCESS_KEY: z.string().min(1),
    R2_BUCKET_NAME: z.string().min(1),
    R2_ACCOUNT_ID: z.string().min(1),

    // --- Bunny Stream (not used at launch) ---
    BUNNY_STREAM_LIBRARY_ID: z.string().min(1).optional(),
    BUNNY_STREAM_TOKEN_AUTH_KEY: z.string().min(1).optional(),

    // --- Email (Resend) ---
    RESEND_API_KEY: z.string().min(1),
    INVOICE_FROM_EMAIL: z.string().min(1),
    NOTIFICATIONS_FROM_EMAIL: z.string().min(1),

    // --- SMSPasal (instructor phone verification) ---
    SMSPASAL_API_KEY: z.string().min(1).optional(),
    SMSPASAL_SENDER_ID: z.string().min(1).optional(),
    SMSPASAL_CAMPAIGN_ID: z.string().min(1).optional(),
    SMSPASAL_ROUTE_ID: z.string().min(1).optional(),
  },
  experimental__runtimeEnv: {},
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
})
