import "server-only"
import { captureError, captureEvent } from "@/lib/observability"
import { GATEWAY_NAMES, getEnabledGateways, getPaymentConfig } from "./config"

/**
 * Called once per server boot (instrumentation.ts). Never throws: a broken
 * payment configuration must not take the whole site down.
 */
export function reportPaymentConfigAtBoot() {
  try {
    const config = getPaymentConfig()
    console.info(
      `[payments] mode=${config.mode} enabled=${getEnabledGateways().join(",") || "none"}`,
      config.disabledReasons,
    )
    for (const gateway of GATEWAY_NAMES) {
      const reason = config.misconfigured[gateway]
      if (reason == null) continue
      console.error(`[payments] ${gateway} DISABLED — misconfigured: ${reason}`)
      captureEvent(`Payment gateway ${gateway} disabled at startup: misconfigured`, {
        area: "startup",
        payment_event: "gateway_disabled",
        gateway,
        mode: config.mode,
      }, { extra: { reason } })
    }
    for (const warning of config.warnings) {
      console.warn(`[payments] ${warning}`)
      captureEvent(`Payment config warning: ${warning}`, { area: "startup", mode: config.mode }, { level: "warning" })
    }
  } catch (error) {
    // Only an invalid PAYMENT_MODE gets here (the env schema already
    // rejects it). Checkout will report its own errors; the site stays up.
    console.error("[payments] payment configuration could not be resolved", error)
    captureError(error, { area: "startup" })
  }
}
