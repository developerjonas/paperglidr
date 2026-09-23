import "server-only";
import { getPaymentConfig, type GatewayName } from "./config";
import { createEsewaGateway } from "./esewa/esewaServer";
import { createFonepayGateway } from "./fonepay/fonepayServer";
import { createKhaltiGateway } from "./khalti/khaltiServer";
import type { PaymentGateway } from "./types";

/**
 * The real gateway for `name`, built from the validated payment config, or
 * null when that gateway is disabled (unconfigured, or switched off via
 * PAYMENT_ENABLED_GATEWAYS). Never falls back to another gateway or mode.
 */
export function getGateway(name: GatewayName): PaymentGateway | null {
  const config = getPaymentConfig();
  switch (name) {
    case "esewa":
      return config.esewa ? createEsewaGateway(config.esewa) : null;
    case "khalti":
      return config.khalti ? createKhaltiGateway(config.khalti) : null;
    case "fonepay":
      return config.fonepay ? createFonepayGateway(config.fonepay) : null;
  }
}
