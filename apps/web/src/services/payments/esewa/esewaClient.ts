import crypto from "crypto";

const ESEWA_PRODUCT_CODE = process.env.ESEWA_PRODUCT_CODE ?? "EPAYTEST";
const ESEWA_SECRET_KEY = process.env.ESEWA_SECRET_KEY!;
const ESEWA_FORM_URL =
  process.env.ESEWA_FORM_URL ??
  "https://rc-epay.esewa.com.np/api/epay/main/v2/form";

function generateEsewaSignature(
  fields: Record<string, string>,
  signedFieldNames: string[],
) {
  const message = signedFieldNames
    .map((name) => `${name}=${fields[name]}`)
    .join(",");
  return crypto
    .createHmac("sha256", ESEWA_SECRET_KEY)
    .update(message)
    .digest("base64");
}

/**
 * eSewa's v2 flow has no server-side "initiate" API call — the form itself
 * IS the initiation. You render these fields, the user's browser POSTs them
 * directly to eSewa. This function is pure (no network) by design.
 */
export function buildEsewaFormPayload({
  amountInPaisa,
  transactionUuid,
  successUrl,
  failureUrl,
}: {
  amountInPaisa: number;
  transactionUuid: string;
  successUrl: string;
  failureUrl: string;
}) {
  // eSewa's API expects rupees with 2 decimals, not paisa — this conversion
  // only exists in this file; every other gateway here works in whole paisa
  const amount = (amountInPaisa / 100).toFixed(2);

  const signedFieldNames = ["total_amount", "transaction_uuid", "product_code"];
  const fields: Record<string, string> = {
    amount,
    tax_amount: "0",
    total_amount: amount,
    transaction_uuid: transactionUuid,
    product_code: ESEWA_PRODUCT_CODE,
    product_service_charge: "0",
    product_delivery_charge: "0",
    success_url: successUrl,
    failure_url: failureUrl,
    signed_field_names: signedFieldNames.join(","),
  };

  return {
    formUrl: ESEWA_FORM_URL,
    fields: {
      ...fields,
      signature: generateEsewaSignature(fields, signedFieldNames),
    },
  };
}
