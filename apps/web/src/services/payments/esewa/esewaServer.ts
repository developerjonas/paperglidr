import type { PaymentGateway, VerifyPaymentResult } from "../types";
import { buildEsewaFormPayload } from "./esewaClient";

const ESEWA_PRODUCT_CODE = process.env.ESEWA_PRODUCT_CODE ?? "EPAYTEST";
const ESEWA_STATUS_URL =
  process.env.ESEWA_STATUS_URL ??
  "https://rc.esewa.com.np/api/epay/transaction/status/";

type EsewaStatusResponse = {
  product_code: string;
  transaction_uuid: string;
  total_amount: string;
  status:
    | "COMPLETE"
    | "PENDING"
    | "FULL_REFUND"
    | "PARTIAL_REFUND"
    | "AMBIGUOUS"
    | "NOT_FOUND"
    | "CANCELED";
  ref_id: string | null;
};

/**
 * Server-to-server verification — the only source of truth for whether
 * eSewa actually received the money. Never trust the redirect back to your
 * success_url alone; that URL shape can be replayed by anyone.
 */
export async function verifyEsewaTransaction({
  transactionUuid,
  totalAmountInPaisa,
}: {
  transactionUuid: string;
  totalAmountInPaisa: number;
}): Promise<VerifyPaymentResult> {
  const totalAmount = (totalAmountInPaisa / 100).toFixed(2);
  const url = new URL(ESEWA_STATUS_URL);
  url.searchParams.set("product_code", ESEWA_PRODUCT_CODE);
  url.searchParams.set("total_amount", totalAmount);
  url.searchParams.set("transaction_uuid", transactionUuid);

  const response = await fetch(url.toString());
  if (!response.ok) {
    return {
      verified: false,
      status: "failed",
      gatewayTransactionId: null,
      amountInPaisa: null,
      raw: await response.text(),
    };
  }

  const data = (await response.json()) as EsewaStatusResponse;
  const isComplete = data.status === "COMPLETE";

  return {
    verified: isComplete,
    status: isComplete
      ? "completed"
      : data.status === "PENDING"
        ? "pending"
        : "failed",
    gatewayTransactionId: data.ref_id,
    amountInPaisa: Math.round(parseFloat(data.total_amount) * 100),
    raw: data,
  };
}

export const esewaGateway: PaymentGateway = {
  async initiate({ purchaseId, amountInPaisa, successUrl, failureUrl }) {
    const { formUrl, fields } = buildEsewaFormPayload({
      amountInPaisa,
      transactionUuid: purchaseId, // purchase.id doubles as transaction_uuid — already unique per attempt
      successUrl,
      failureUrl,
    });
    return {
      type: "redirect",
      url: formUrl,
      method: "POST",
      formFields: fields,
    };
  },
  async verify({ gatewayCheckoutId, amountInPaisa }) {
    return verifyEsewaTransaction({
      transactionUuid: gatewayCheckoutId,
      totalAmountInPaisa: amountInPaisa,
    });
  },
};
