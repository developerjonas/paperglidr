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

  // Payment config boot check: resolving it throws PaymentConfigError for a
  // live deployment carrying a sandbox URL or test credential, so a bad
  // deploy fails loudly instead of quietly taking test payments. Also logs
  // which gateways are enabled and why the others aren't.
  const { getPaymentConfig, getEnabledGateways } = await import(
    "@/services/payments/config"
  )
  const config = getPaymentConfig()
  console.info(
    `[payments] mode=${config.mode} enabled=${getEnabledGateways().join(",") || "none"}`,
    config.disabledReasons,
  )
}

// Errors thrown while rendering pages, route handlers and server actions
// that nothing else caught.
export const onRequestError = Sentry.captureRequestError
