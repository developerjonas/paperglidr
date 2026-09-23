import "server-only";
import { env as clientEnv } from "@/data/env/client";
import type { GatewayName } from "./config";

/**
 * Where each gateway sends the buyer's browser back to. The purchase id is
 * a PATH segment: eSewa appends "?data=..." to success_url verbatim, which
 * corrupted the old "?purchaseId=..." query string.
 */
export function getReturnUrls(gateway: GatewayName, purchaseId: string) {
  const base = `${clientEnv.NEXT_PUBLIC_APP_URL}/api/payments/${gateway}`;
  switch (gateway) {
    case "esewa":
      return {
        successUrl: `${base}/return/${purchaseId}`,
        failureUrl: `${base}/failure/${purchaseId}`,
      };
    case "khalti":
      // Khalti has one return_url for every outcome.
      return {
        successUrl: `${base}/return/${purchaseId}`,
        failureUrl: `${base}/return/${purchaseId}`,
      };
    case "fonepay":
      // QR flow: no browser redirect; the checkout page polls
      // /api/payments/fonepay/status/[purchaseId].
      return { successUrl: "", failureUrl: "" };
  }
}
