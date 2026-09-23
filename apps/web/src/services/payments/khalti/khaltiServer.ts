import { env as clientEnv } from "@/data/env/client";
import type { KhaltiConfig } from "../config";
import {
  errorResult,
  type GatewayPaymentStatus,
  type PaymentGateway,
  type VerifyPaymentResult,
} from "../types";
import { initiateKhaltiPayment } from "./khaltiClient";

type KhaltiLookupResponse = {
  pidx: string;
  total_amount: number;
  status:
    | "Completed"
    | "Pending"
    | "Initiated"
    | "Expired"
    | "User canceled"
    | "Refunded"
    | "Partially Refunded";
  transaction_id: string | null;
};

const STATUS_MAP: Record<string, GatewayPaymentStatus> = {
  Completed: "completed",
  Pending: "pending",
  Initiated: "pending",
  Expired: "failed",
  "User canceled": "failed",
  Refunded: "failed",
  "Partially Refunded": "failed",
};

export async function verifyKhaltiTransaction(
  config: KhaltiConfig,
  { pidx }: { pidx: string },
): Promise<VerifyPaymentResult> {
  const response = await fetch(`${config.baseUrl}/epayment/lookup/`, {
    method: "POST",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Key ${config.secretKey}`,
    },
    body: JSON.stringify({ pidx }),
  });

  // Khalti answers 404 for a pidx it doesn't know.
  if (response.status === 404) {
    return {
      status: "not_found",
      amountInPaisa: null,
      gatewayTransactionId: null,
      gatewayStatus: "404",
      raw: await response.text(),
    };
  }
  if (!response.ok) {
    return errorResult({ httpStatus: response.status, body: await response.text() });
  }

  const data = (await response.json()) as KhaltiLookupResponse;
  if (data.pidx !== pidx) {
    return errorResult({ reason: "lookup response mismatch", data });
  }

  return {
    status: STATUS_MAP[data.status] ?? "error",
    // Khalti's native unit is already paisa.
    amountInPaisa: Number.isInteger(data.total_amount) ? data.total_amount : null,
    gatewayTransactionId: data.transaction_id,
    gatewayStatus: data.status,
    raw: data,
  };
}

export const createKhaltiGateway = (config: KhaltiConfig): PaymentGateway => ({
  async initiate({ purchaseId, amountInPaisa, productName, successUrl }) {
    const result = await initiateKhaltiPayment(config, {
      amountInPaisa,
      purchaseOrderId: purchaseId,
      purchaseOrderName: productName,
      returnUrl: successUrl,
      websiteUrl: clientEnv.NEXT_PUBLIC_APP_URL,
    });
    return {
      type: "redirect",
      url: result.payment_url,
      checkoutId: result.pidx,
    };
  },
  async verify({ gatewayCheckoutId }) {
    // gatewayCheckoutId holds the pidx Khalti returned at initiation.
    return verifyKhaltiTransaction(config, { pidx: gatewayCheckoutId });
  },
});
