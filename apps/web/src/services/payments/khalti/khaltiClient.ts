import type { KhaltiConfig } from "../config";

type KhaltiInitiateResponse = {
  pidx: string;
  payment_url: string;
  expires_at: string;
  expires_in: number;
};

/**
 * Unlike eSewa, this IS a real server-to-server call before the user sees
 * anything — it returns a `pidx` immediately, which becomes your
 * gatewayTransactionId from the moment of initiation, not just on completion.
 */
export async function initiateKhaltiPayment(
  config: KhaltiConfig,
  {
    amountInPaisa,
    purchaseOrderId,
    purchaseOrderName,
    returnUrl,
    websiteUrl,
    customerInfo,
  }: {
    amountInPaisa: number;
    purchaseOrderId: string;
    purchaseOrderName: string;
    returnUrl: string;
    websiteUrl: string;
    customerInfo?: { name?: string; email?: string; phone?: string };
  },
): Promise<KhaltiInitiateResponse> {
  const response = await fetch(`${config.baseUrl}/epayment/initiate/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Key ${config.secretKey}`,
    },
    body: JSON.stringify({
      return_url: returnUrl,
      website_url: websiteUrl,
      amount: amountInPaisa, // Khalti's native unit is already paisa — no conversion
      purchase_order_id: purchaseOrderId,
      purchase_order_name: purchaseOrderName,
      customer_info: customerInfo,
    }),
  });

  if (!response.ok) {
    throw new Error(
      `Khalti initiate failed: ${response.status} ${await response.text()}`,
    );
  }

  return response.json();
}
