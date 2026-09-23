import crypto from "crypto";
import type { EsewaConfig } from "../config";
import {
  errorResult,
  rupeesToPaisa,
  type GatewayPaymentStatus,
  type PaymentGateway,
  type VerifyPaymentResult,
} from "../types";
import { buildEsewaFormPayload, signEsewaFields } from "./esewaClient";

type EsewaStatusResponse = {
  product_code: string;
  transaction_uuid: string;
  total_amount: number | string;
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

const STATUS_MAP: Record<string, GatewayPaymentStatus> = {
  COMPLETE: "completed",
  PENDING: "pending",
  AMBIGUOUS: "pending",
  NOT_FOUND: "not_found",
  CANCELED: "failed",
  FULL_REFUND: "failed",
  PARTIAL_REFUND: "failed",
};

/**
 * Server-to-server verification — the only source of truth for whether
 * eSewa actually received the money. Never trust the redirect back to your
 * success_url alone; that URL shape can be replayed by anyone.
 */
export async function verifyEsewaTransaction(
  config: EsewaConfig,
  {
    transactionUuid,
    totalAmountInPaisa,
  }: {
    transactionUuid: string;
    totalAmountInPaisa: number;
  },
): Promise<VerifyPaymentResult> {
  const url = new URL(config.statusUrl);
  url.searchParams.set("product_code", config.productCode);
  url.searchParams.set("total_amount", (totalAmountInPaisa / 100).toFixed(2));
  url.searchParams.set("transaction_uuid", transactionUuid);

  const response = await fetch(url.toString(), { cache: "no-store" });
  if (!response.ok) {
    return errorResult({ httpStatus: response.status, body: await response.text() });
  }

  const data = (await response.json()) as EsewaStatusResponse;
  // The answer must be about the transaction we asked about.
  if (
    data.transaction_uuid !== transactionUuid ||
    data.product_code !== config.productCode
  ) {
    return errorResult({ reason: "status response mismatch", data });
  }

  return {
    status: STATUS_MAP[data.status] ?? "error",
    amountInPaisa: rupeesToPaisa(data.total_amount),
    gatewayTransactionId: data.ref_id,
    gatewayStatus: data.status,
    raw: data,
  };
}

export type EsewaResponseCheck =
  | { valid: true; transactionUuid: string; status: string; totalAmountInPaisa: number | null }
  | { valid: false; reason: string };

/**
 * eSewa appends ?data=<base64 JSON> to success_url. Its HMAC is checked
 * here, but it is only a hint: the status API stays the authority for
 * whether money moved (verifyEsewaTransaction).
 */
export function decodeEsewaResponse(
  config: EsewaConfig,
  data: string,
): EsewaResponseCheck {
  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(Buffer.from(data, "base64").toString("utf8"));
  } catch {
    return { valid: false, reason: "undecodable data" };
  }
  const signedFieldNames =
    typeof payload.signed_field_names === "string"
      ? payload.signed_field_names.split(",")
      : [];
  if (signedFieldNames.length === 0 || typeof payload.signature !== "string") {
    return { valid: false, reason: "missing signature" };
  }
  const fields = Object.fromEntries(
    signedFieldNames.map(name => [name, String(payload[name] ?? "")]),
  );
  const expected = Buffer.from(
    signEsewaFields(fields, signedFieldNames, config.secretKey),
  );
  const actual = Buffer.from(payload.signature);
  if (expected.length !== actual.length || !crypto.timingSafeEqual(expected, actual)) {
    return { valid: false, reason: "bad signature" };
  }
  if (payload.product_code !== config.productCode) {
    return { valid: false, reason: "product code mismatch" };
  }
  return {
    valid: true,
    transactionUuid: String(payload.transaction_uuid ?? ""),
    status: String(payload.status ?? ""),
    totalAmountInPaisa: rupeesToPaisa(payload.total_amount),
  };
}

export const createEsewaGateway = (config: EsewaConfig): PaymentGateway => ({
  async initiate({ purchaseId, amountInPaisa, successUrl, failureUrl }) {
    const { formUrl, fields } = buildEsewaFormPayload(config, {
      amountInPaisa,
      transactionUuid: purchaseId, // purchase.id doubles as transaction_uuid — unique per attempt
      successUrl,
      failureUrl,
    });
    return {
      type: "redirect",
      url: formUrl,
      method: "POST",
      formFields: fields,
      checkoutId: purchaseId,
    };
  },
  async verify({ purchaseId, expectedAmountInPaisa }) {
    // transaction_uuid is the purchase id (see initiate) — previously this
    // queried with gatewayCheckoutId (the idempotency key), which eSewa
    // never saw, so verification could never succeed.
    return verifyEsewaTransaction(config, {
      transactionUuid: purchaseId,
      totalAmountInPaisa: expectedAmountInPaisa,
    });
  },
});
