export type InitiatePaymentInput = {
  purchaseId: string;
  amountInPaisa: number;
  productName: string;
  successUrl: string;
  failureUrl: string;
};

export type InitiatePaymentResult =
  | {
      type: "redirect";
      url: string;
      method?: "GET" | "POST";
      formFields?: Record<string, string>;
      // Some gateways (Khalti) assign a transaction reference the moment you
      // call initiate — before the user has paid anything. Others (eSewa)
      // assign nothing until payment completes. This is optional because
      // that asymmetry is real, not a modeling mistake.
      gatewayTransactionId?: string;
    }
  | {
      type: "qr";
      qrString: string;
      expiresAt: Date;
      gatewayTransactionId?: string;
    };

export type VerifyPaymentInput = {
  gatewayCheckoutId: string;
  gatewayTransactionId?: string | null;
  amountInPaisa: number;
};

export type VerifyPaymentResult = {
  verified: boolean;
  status: "completed" | "pending" | "failed";
  gatewayTransactionId: string | null;
  amountInPaisa: number | null;
  raw: unknown;
};

export interface PaymentGateway {
  initiate(input: InitiatePaymentInput): Promise<InitiatePaymentResult>;
  verify(input: VerifyPaymentInput): Promise<VerifyPaymentResult>;
}
