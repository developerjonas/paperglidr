export type InitiatePaymentInput = {
  purchaseId: string;
  amountInPaisa: number;
  productName: string;
  successUrl: string;
  failureUrl: string;
};

export type InitiatePaymentResult = (
  | {
      type: "redirect";
      url: string;
      method?: "GET" | "POST";
      formFields?: Record<string, string>;
    }
  | {
      type: "qr";
      qrString: string;
      expiresAt: Date;
    }
) & {
  // The gateway's reference for THIS checkout attempt, used later to ask
  // the gateway what happened: eSewa transaction_uuid (= purchase id),
  // Khalti pidx, Fonepay PRN (= purchase id). Stored as
  // purchases.gatewayCheckoutId.
  checkoutId: string;
};

export type VerifyPaymentInput = {
  purchaseId: string;
  gatewayCheckoutId: string;
  expectedAmountInPaisa: number;
};

/**
 * completed  — gateway says the money was received (amount still checked
 *              by the caller, never by trusting this status alone)
 * pending    — not finished yet; ask again later
 * failed     — terminal: cancelled, expired, refunded at the gateway
 * not_found  — gateway has no record (yet); terminal only after a grace
 *              period, decided by the caller
 * error      — we couldn't get an answer (network, 5xx, malformed
 *              response). Must never change the purchase's state.
 */
export type GatewayPaymentStatus =
  | "completed"
  | "pending"
  | "failed"
  | "not_found"
  | "error";

export type VerifyPaymentResult = {
  status: GatewayPaymentStatus;
  /** Amount the gateway reports as paid, in paisa, or null if unknown. */
  amountInPaisa: number | null;
  /** The gateway's final transaction reference (eSewa ref_id, Khalti transaction_id, Fonepay trace id). */
  gatewayTransactionId: string | null;
  /** The gateway's own status string, verbatim — for logs and events. */
  gatewayStatus: string | null;
  raw: unknown;
};

export interface PaymentGateway {
  initiate(input: InitiatePaymentInput): Promise<InitiatePaymentResult>;
  verify(input: VerifyPaymentInput): Promise<VerifyPaymentResult>;
}

/** What verifyAndFulfil needs from a gateway. */
export type PaymentVerifier = Pick<PaymentGateway, "verify">;

/**
 * Gateways report rupees as numbers (eSewa status API: 999.0), strings
 * ("100.00"), or comma-grouped strings ("1,000.0"). Returns whole paisa or
 * null when the value isn't a clean amount.
 */
export function rupeesToPaisa(value: unknown): number | null {
  const text =
    typeof value === "number"
      ? String(value)
      : typeof value === "string"
        ? value.replace(/,/g, "").trim()
        : "";
  if (!/^\d+(\.\d{1,2}0*)?$/.test(text)) return null;
  return Math.round(Number(text) * 100);
}

export function errorResult(raw: unknown): VerifyPaymentResult {
  return {
    status: "error",
    amountInPaisa: null,
    gatewayTransactionId: null,
    gatewayStatus: null,
    raw,
  };
}
