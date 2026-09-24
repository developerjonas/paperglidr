// Sentry in the browser. Next.js loads this file before the app hydrates.
// NEXT_PUBLIC_SENTRY_DSN is inlined at build time; unset = no Sentry.
import * as Sentry from "@sentry/nextjs"
import { sentryOptions } from "@/lib/sentryOptions"

if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init(sentryOptions(process.env.NEXT_PUBLIC_SENTRY_DSN))
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart
