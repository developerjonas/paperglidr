import crypto from "crypto";
import type { EsewaConfig } from "../config";

export function signEsewaFields(
  fields: Record<string, string>,
  signedFieldNames: string[],
  secretKey: string,
) {
  const message = signedFieldNames
    .map((name) => `${name}=${fields[name]}`)
    .join(",");
  return crypto.createHmac("sha256", secretKey).update(message).digest("base64");
}

/**
 * eSewa's v2 flow has no server-side "initiate" API call — the form itself
 * IS the initiation. You render these fields, the user's browser POSTs them
 * directly to eSewa. This function is pure (no network) by design.
 */
export function buildEsewaFormPayload(
  config: EsewaConfig,
  {
    amountInPaisa,
    transactionUuid,
    successUrl,
    failureUrl,
  }: {
    amountInPaisa: number;
    transactionUuid: string;
    successUrl: string;
    failureUrl: string;
  },
) {
  // eSewa's API expects rupees with 2 decimals, not paisa — this conversion
  // only exists in this file; every other gateway here works in whole paisa
  const amount = (amountInPaisa / 100).toFixed(2);

  const signedFieldNames = ["total_amount", "transaction_uuid", "product_code"];
  const fields: Record<string, string> = {
    amount,
    tax_amount: "0",
    total_amount: amount,
    transaction_uuid: transactionUuid,
    product_code: config.productCode,
    product_service_charge: "0",
    product_delivery_charge: "0",
    success_url: successUrl,
    failure_url: failureUrl,
    signed_field_names: signedFieldNames.join(","),
  };

  return {
    formUrl: config.formUrl,
    fields: {
      ...fields,
      signature: signEsewaFields(fields, signedFieldNames, config.secretKey),
    },
  };
}
