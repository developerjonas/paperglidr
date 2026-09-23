import { createEnv } from "@t3-oss/env-nextjs"
import { z } from "zod"

// Server-only variables. Public (NEXT_PUBLIC_*) variables live in
// ./client.ts and database variables in ./db.ts — server code may import all three.
//
// Payment variables are declared here but only READ by
// services/payments/config.ts, which applies the sandbox/live rules.
export const env = createEnv({
  server: {
    // --- Better Auth ---
    BETTER_AUTH_SECRET: z.string().min(1),
    BETTER_AUTH_URL: z.string().url(),
    GOOGLE_CLIENT_ID: z.string().min(1),
    GOOGLE_CLIENT_SECRET: z.string().min(1),
    // GitHub sign-in is registered only when both are set
    GITHUB_CLIENT_ID: z.string().min(1).optional(),
    GITHUB_CLIENT_SECRET: z.string().min(1).optional(),
    // Extra origins allowed to call the auth API, comma-separated, e.g.
    // "https://www.paperglidr.com,paperglidr://". BETTER_AUTH_URL's own
    // origin (https://paperglidr.com) is always trusted. Parsed in lib/auth.ts.
    BETTER_AUTH_TRUSTED_ORIGINS: z
      .string()
      .optional()
      .refine(
        value =>
          value == null ||
          value
            .split(",")
            .map(origin => origin.trim())
            .filter(Boolean)
            .every(origin => /^[a-z][a-z0-9+.-]*:\/\//i.test(origin)),
        "Each origin must start with a scheme, e.g. https:// or paperglidr://",
      ),
    // Parent domain for a cookie shared across subdomains. Not needed while
    // everything is served from paperglidr.com — leave unset (host-only).
    AUTH_COOKIE_DOMAIN: z.string().min(1).optional(),

    // --- R2 (object storage) ---
    R2_ACCESS_KEY_ID: z.string().min(1),
    R2_SECRET_ACCESS_KEY: z.string().min(1),
    R2_BUCKET_NAME: z.string().min(1),
    R2_ACCOUNT_ID: z.string().min(1),
    // Public bucket for product thumbnails and instructor photos, served
    // from a custom domain (R2_PUBLIC_BASE_URL, e.g.
    // https://images.paperglidr.com). Lesson files never go here.
    R2_PUBLIC_BUCKET_NAME: z.string().min(1),
    R2_PUBLIC_BASE_URL: z
      .string()
      .url()
      .refine(url => !url.endsWith("/"), "No trailing slash"),

    // --- Bunny Stream (not used at launch) ---
    BUNNY_STREAM_LIBRARY_ID: z.string().min(1).optional(),
    BUNNY_STREAM_TOKEN_AUTH_KEY: z.string().min(1).optional(),

    // --- Email (Resend) ---
    RESEND_API_KEY: z.string().min(1),
    INVOICE_FROM_EMAIL: z.string().min(1),
    NOTIFICATIONS_FROM_EMAIL: z.string().min(1),

    // --- Payments (resolved by services/payments/config.ts) ---
    // Required, no default: a deploy must say explicitly whether it takes
    // real money.
    PAYMENT_MODE: z.enum(["sandbox", "live"]),
    // Optional allow-list / kill switch, e.g. "esewa,khalti". Unset = every
    // configured gateway.
    PAYMENT_ENABLED_GATEWAYS: z.string().optional(),
    ESEWA_PRODUCT_CODE: z.string().min(1).optional(),
    ESEWA_SECRET_KEY: z.string().min(1).optional(),
    ESEWA_FORM_URL: z.string().url().optional(),
    ESEWA_STATUS_URL: z.string().url().optional(),
    KHALTI_SECRET_KEY: z.string().min(1).optional(),
    KHALTI_BASE_URL: z.string().url().optional(),
    FONEPAY_MERCHANT_CODE: z.string().min(1).optional(),
    FONEPAY_SECRET_KEY: z.string().min(1).optional(),
    FONEPAY_USERNAME: z.string().min(1).optional(),
    FONEPAY_PASSWORD: z.string().min(1).optional(),
    FONEPAY_BASE_URL: z.string().url().optional(),

    // Shared secret for /api/cron/reconcile-payments (Bearer token). Unset =
    // the endpoint refuses every request.
    CRON_SECRET: z.string().min(32).optional(),

    // --- SMSPasal (instructor phone verification) ---
    SMSPASAL_API_KEY: z.string().min(1).optional(),
    SMSPASAL_SENDER_ID: z.string().min(1).optional(),
    SMSPASAL_CAMPAIGN_ID: z.string().min(1).optional(),
    SMSPASAL_ROUTE_ID: z.string().min(1).optional(),
  },
  experimental__runtimeEnv: {},
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
})
