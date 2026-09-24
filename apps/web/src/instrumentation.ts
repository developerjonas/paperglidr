import * as Sentry from "@sentry/nextjs"

// Runs once when a server instance boots (next start / each serverless
// cold start), before it handles requests.
export async function register() {
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config")
    return
  }
  if (process.env.NEXT_RUNTIME !== "nodejs") return

  await import("./sentry.server.config")

  // Payment config boot check. A live gateway configured with a sandbox
  // URL, a test credential or a non-https URL is switched off (never used,
  // never a fallback) and reported; the site and every correctly
  // configured gateway keep working. Also logs which gateways are enabled
  // and why the others aren't.
  const { reportPaymentConfigAtBoot } = await import("@/services/payments/bootCheck")
  reportPaymentConfigAtBoot()
}

// Errors thrown while rendering pages, route handlers and server actions
// that nothing else caught.
export const onRequestError = Sentry.captureRequestError
