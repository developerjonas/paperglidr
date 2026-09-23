// Public URL of the web app (courses, sign-up, checkout), e.g.
// https://app.paperglidr.com. Inlined at build time — every page on this
// site is statically prerendered, so it must be set when building.
const appUrl = process.env.NEXT_PUBLIC_APP_URL

if (!appUrl && !process.env.SKIP_ENV_VALIDATION) {
  throw new Error(
    "NEXT_PUBLIC_APP_URL is not set — see apps/landing/.env.example",
  )
}

export const APP_URL = (appUrl ?? "").replace(/\/+$/, "")
