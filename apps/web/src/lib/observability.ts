import * as Sentry from "@sentry/nextjs"

/**
 * Tags used by the alert rules in docs/OBSERVABILITY.md. Keep the names in
 * sync with that doc.
 * - area: payments | deliver | action | route | startup
 * - payment_event (area=payments): verify_error | gateway_error |
 *   amount_mismatch | reused_transaction | fulfilment_error |
 *   gateway_disabled
 */
export type ObservabilityTags = {
  area: "payments" | "deliver" | "action" | "route" | "startup"
  payment_event?:
    | "verify_error"
    | "gateway_error"
    | "amount_mismatch"
    | "reused_transaction"
    | "fulfilment_error"
    | "gateway_disabled"
  [key: string]: string | undefined
}

const cleanTags = (tags: ObservabilityTags) =>
  Object.fromEntries(Object.entries(tags).filter(([, value]) => value != null)) as Record<string, string>

/** Report an error to Sentry (no-op when Sentry isn't configured). */
export function captureError(error: unknown, tags: ObservabilityTags, extra?: Record<string, unknown>) {
  Sentry.captureException(error, { tags: cleanTags(tags), extra })
}

/** Report a condition that isn't an exception (e.g. an amount mismatch). */
export function captureEvent(
  message: string,
  tags: ObservabilityTags,
  { level = "error", extra }: { level?: "warning" | "error"; extra?: Record<string, unknown> } = {},
) {
  Sentry.captureMessage(message, { level, tags: cleanTags(tags), extra })
}
