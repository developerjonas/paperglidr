// Sentry in the browser. Next.js loads this file before the app hydrates.
// NEXT_PUBLIC_SENTRY_DSN is inlined at build time; unset = no Sentry.
import * as Sentry from "@sentry/nextjs"
import { sentryOptions } from "@/lib/sentryOptions"

if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    ...sentryOptions(process.env.NEXT_PUBLIC_SENTRY_DSN),
    // Through our own domain (app/api/monitoring), so ad blockers that
    // block the error service's domain don't drop browser errors.
    tunnel: "/api/monitoring",
    // GlitchTip has no release-health sessions; don't send them.
    integrations: (defaults) => defaults.filter((integration) => integration.name !== "BrowserSession"),
  })
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart
