import type { PaymentGateway, VerifyPaymentResult } from "../types";
import { initiateKhaltiPayment } from "./khaltiClient";

const KHALTI_SECRET_KEY = process.env.KHALTI_SECRET_KEY!;
const KHALTI_LOOKUP_URL =
  process.env.KHALTI_LOOKUP_URL ??
  "https://dev.khalti.com/api/v2/epayment/lookup/";

type KhaltiLookupResponse = {
  pidx: string;
  total_amount: number;
  status:
    | "Completed"
    | "Pending"
    | "Expired"
    | "User canceled"
    | "Refunded"
    | "Partially Refunded";
  transaction_id: string | null;
};

export async function verifyKhaltiTransaction({
  pidx,
}: {
  pidx: string;
}): Promise<VerifyPaymentResult> {
  const response = await fetch(KHALTI_LOOKUP_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Key ${KHALTI_SECRET_KEY}`,
    },
    body: JSON.stringify({ pidx }),
  });

  if (!response.ok) {
    return {
      verified: false,
      status: "failed",
      gatewayTransactionId: null,
      amountInPaisa: null,
      raw: await response.text(),
    };
  }

  const data = (await response.json()) as KhaltiLookupResponse;
  const isComplete = data.status === "Completed";

  return {
    verified: isComplete,
    status: isComplete
      ? "completed"
      : data.status === "Pending"
        ? "pending"
        : "failed",
    gatewayTransactionId: data.transaction_id ?? data.pidx,
    amountInPaisa: data.total_amount,
    raw: data,
  };
}

export const khaltiGateway: PaymentGateway = {
  async initiate({ purchaseId, amountInPaisa, productName, successUrl }) {
    const result = await initiateKhaltiPayment({
      amountInPaisa,
      purchaseOrderId: purchaseId,
      purchaseOrderName: productName,
      returnUrl: successUrl,
      websiteUrl: process.env.NEXT_PUBLIC_APP_URL!,
    });
    return {
      type: "redirect",
      url: result.payment_url,
      gatewayTransactionId: result.pidx,
    };
  },
  async verify({ gatewayTransactionId, gatewayCheckoutId }) {
    // pidx is what Khalti's lookup API needs. We store it as
    // gatewayTransactionId the moment initiate responds (see purchases
    // action), so prefer that — gatewayCheckoutId is only a fallback.
    const pidx = gatewayTransactionId ?? gatewayCheckoutId;
    return verifyKhaltiTransaction({ pidx });
  },
};
