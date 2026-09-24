// Shared Sentry init options for the server, edge and browser runtimes.
// Every runtime is a no-op when its DSN is unset: Sentry.init isn't called,
// and captureException/captureMessage do nothing.
//
// Read from process.env directly (not data/env/*): these run in the edge
// runtime and the browser, before the app's env modules, and the literal
// process.env.NEXT_PUBLIC_* reference is what Next inlines client-side.
// The values are still declared (and validated) in data/env/server.ts and
// data/env/client.ts.
import type { ErrorEvent } from "@sentry/nextjs"

const SCRUBBED = "[scrubbed]"

/**
 * Drizzle's DrizzleQueryError message is "Failed query: <sql>\nparams: …",
 * and the params can be personal data (payout bank details, emails). Keep
 * the SQL, drop the params. Request cookies and headers are removed too.
 */
export function scrubEvent(event: ErrorEvent): ErrorEvent {
  for (const exception of event.exception?.values ?? []) {
    if (exception.value) exception.value = exception.value.replace(/\nparams: [\s\S]*$/, `\nparams: ${SCRUBBED}`)
  }
  if (event.message) event.message = event.message.replace(/\nparams: [\s\S]*$/, `\nparams: ${SCRUBBED}`)
  // Console output is recorded as breadcrumbs, and safeError logs the full
  // error just before reporting it, so scrub those too. A console
  // breadcrumb's raw arguments (the error object itself) are dropped.
  for (const breadcrumb of event.breadcrumbs ?? []) {
    if (breadcrumb.message) {
      breadcrumb.message = breadcrumb.message.replace(/\nparams: [\s\S]*$/, `\nparams: ${SCRUBBED}`)
    }
    if (breadcrumb.category === "console") delete breadcrumb.data
  }
  if (event.request) {
    delete event.request.cookies
    delete event.request.headers
    delete event.request.data
  }
  return event
}

export function sentryOptions(dsn: string | undefined) {
  const rate = Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE ?? 0)
  return {
    dsn,
    enabled: Boolean(dsn),
    environment:
      process.env.SENTRY_ENVIRONMENT ?? process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT ?? process.env.VERCEL_ENV ?? "development",
    // Errors only by default; set SENTRY_TRACES_SAMPLE_RATE (0–1) for traces.
    tracesSampleRate: Number.isFinite(rate) ? Math.min(Math.max(rate, 0), 1) : 0,
    // No IPs, cookies or user details unless we attach them deliberately.
    sendDefaultPii: false,
    beforeSend: scrubEvent,
  }
}
