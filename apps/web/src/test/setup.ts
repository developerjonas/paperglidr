import { vi } from "vitest"

// These tests write to a real Postgres (transactions and concurrency need
// the real thing). Refuse to run unless the database is explicitly marked
// disposable — same guard as scripts/security-smoke-test.mjs.
if (process.env.TEST_DB_IS_THROWAWAY !== "1") {
  throw new Error(
    "Refusing to run: tests write to the database in DB_*. Point DB_* at a throwaway Postgres (migrated) and set TEST_DB_IS_THROWAWAY=1.",
  )
}

// Placeholders for env the app validates at import time. Never real values.
const placeholders: Record<string, string> = {
  BETTER_AUTH_SECRET: "test-only-placeholder-secret-0123456789abcdef",
  BETTER_AUTH_URL: "http://localhost:3000",
  GOOGLE_CLIENT_ID: "test-placeholder",
  GOOGLE_CLIENT_SECRET: "test-placeholder",
  NEXT_PUBLIC_APP_URL: "http://localhost:3000",
  NEXT_PUBLIC_BETTER_AUTH_URL: "http://localhost:3000",
  R2_ACCOUNT_ID: "test-placeholder",
  R2_ACCESS_KEY_ID: "test-placeholder",
  R2_SECRET_ACCESS_KEY: "test-placeholder",
  R2_BUCKET_NAME: "test-placeholder",
  R2_PUBLIC_BUCKET_NAME: "test-placeholder",
  R2_PUBLIC_BASE_URL: "https://images.example.test",
  RESEND_API_KEY: "re_test_placeholder",
  INVOICE_FROM_EMAIL: "billing@example.test",
  NOTIFICATIONS_FROM_EMAIL: "notify@example.test",
}
for (const [key, value] of Object.entries(placeholders)) {
  process.env[key] ??= value
}
// Tests always run in sandbox mode with no real gateway keys.
process.env.PAYMENT_MODE = "sandbox"
delete process.env.KHALTI_SECRET_KEY
delete process.env.FONEPAY_MERCHANT_CODE

// Outside a Next request there is no cache to revalidate.
vi.mock("next/cache", () => ({
  revalidateTag: vi.fn(),
  revalidatePath: vi.fn(),
  unstable_cache: (fn: unknown) => fn,
}))
