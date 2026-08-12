import { createEnv } from "@t3-oss/env-nextjs"
import { z } from "zod"

export const env = createEnv({
  server: {
    // --- Database (confirmed, unchanged) ---
    DB_PASSWORD: z.string().min(1),
    DB_USER: z.string().min(1),
    DB_NAME: z.string().min(1),
    DB_HOST: z.string().min(1),

    // --- Better Auth ---
    BETTER_AUTH_SECRET: z.string().min(1),
    // NEXT_PUBLIC_BETTER_AUTH_URL moved to client block below

    // --- Payments: fonepay only, in progress ---
    // Optional for now since credentials haven't been obtained yet —
    // flip both to required once you actually have them, so a missing
    // key fails loudly at build time instead of silently at checkout.
    FONEPAY_MERCHANT_CODE: z.string().min(1).optional(),
    FONEPAY_SECRET_KEY: z.string().min(1).optional(),
    // esewa/khalti intentionally NOT declared — not in use yet. Add
    // back when you actually wire them in, not before.

    // --- R2 (object storage) --- ADJUST: still guessed, never seen r2.ts
    R2_ACCESS_KEY_ID: z.string().min(1),
    R2_SECRET_ACCESS_KEY: z.string().min(1),
    R2_BUCKET_NAME: z.string().min(1),
    R2_ACCOUNT_ID: z.string().min(1),

    // --- Email (Resend) ---
    RESEND_API_KEY: z.string().min(1),
    INVOICE_FROM_EMAIL: z.string().min(1),

    // --- SMSPasal (confirmed live values above) ---
    SMSPASAL_API_KEY: z.string().min(1).optional(),
    SMSPASAL_SENDER_ID: z.string().min(1).optional(),
    SMSPASAL_CAMPAIGN_ID: z.string().min(1).optional(),
    SMSPASAL_ROUTE_ID: z.string().min(1).optional(),
  },
  client: {
    // NEXT_PUBLIC_* vars must live here per t3-oss/env-nextjs, not in server
    NEXT_PUBLIC_SERVER_URL: z.string().min(1), // used server-side too (email links) — fine, client vars are readable server-side, just not vice versa
    NEXT_PUBLIC_BETTER_AUTH_URL: z.string().min(1),
  },
  runtimeEnv: {
    DB_PASSWORD: process.env.DB_PASSWORD,
    DB_USER: process.env.DB_USER,
    DB_NAME: process.env.DB_NAME,
    DB_HOST: process.env.DB_HOST,

    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    NEXT_PUBLIC_BETTER_AUTH_URL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL,

    FONEPAY_MERCHANT_CODE: process.env.FONEPAY_MERCHANT_CODE,
    FONEPAY_SECRET_KEY: process.env.FONEPAY_SECRET_KEY,

    R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID,
    R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY,
    R2_BUCKET_NAME: process.env.R2_BUCKET_NAME,
    R2_ACCOUNT_ID: process.env.R2_ACCOUNT_ID,

    RESEND_API_KEY: process.env.RESEND_API_KEY,
    INVOICE_FROM_EMAIL: process.env.INVOICE_FROM_EMAIL,
    NEXT_PUBLIC_SERVER_URL: process.env.NEXT_PUBLIC_SERVER_URL,

    SMSPASAL_API_KEY: process.env.SMSPASAL_API_KEY,
    SMSPASAL_SENDER_ID: process.env.SMSPASAL_SENDER_ID,
    SMSPASAL_CAMPAIGN_ID: process.env.SMSPASAL_CAMPAIGN_ID,
    SMSPASAL_ROUTE_ID: process.env.SMSPASAL_ROUTE_ID,
  },
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
})
