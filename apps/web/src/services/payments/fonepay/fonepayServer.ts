import type { FonepayConfig } from "../config"
import type { PaymentGateway, VerifyPaymentResult, InitiatePaymentResult } from "../types"
import { buildFonepayQrSignature, buildFonepayStatusSignature } from "./fonepayClient"

type FonepayQrDownloadResponse = {
  qrMessage?: string
  thirdpartyQrWebSocketUrl?: string
  success: boolean
  message?: string
}

type FonepayStatusResponse = {
  paymentStatus: "success" | "pending" | "failed" | "expired"
  prn: string
  fonepayTraceId?: number
  amount?: string
}

// QR codes are valid for a limited window before the customer must be shown
// a fresh one — 15 minutes is a common default across the integration
// guides; confirm the real figure from your bank/Fonepay merchant docs.
const QR_VALIDITY_MINUTES = 15

export async function generateFonepayQr(
  config: FonepayConfig,
  {
    purchaseId,
    amountInPaisa,
    productName,
  }: {
    purchaseId: string
    amountInPaisa: number
    productName: string
  },
): Promise<InitiatePaymentResult> {
  const prn = purchaseId
  const remarks1 = productName.slice(0, 160) // Fonepay's R1 field has a max length
  const remarks2 = "Paperglidr purchase"
  const { amount, signature } = buildFonepayQrSignature(config, {
    amountInPaisa,
    prn,
    remarks1,
    remarks2,
  })
  const response = await fetch(`${config.baseUrl}/thirdPartyDynamicQrDownload`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      amount,
      prn,
      merchantCode: config.merchantCode,
      dataValidation: signature,
      username: config.username,
      password: config.password,
      remarks1,
      remarks2,
    }),
  })
  if (!response.ok) {
    throw new Error(`Fonepay QR generation failed: ${response.status} ${await response.text()}`)
  }
  const data = (await response.json()) as FonepayQrDownloadResponse
  if (!data.success || data.qrMessage == null) {
    throw new Error(`Fonepay QR generation rejected: ${data.message ?? "unknown error"}`)
  }
  return {
    type: "qr",
    qrString: data.qrMessage,
    expiresAt: new Date(Date.now() + QR_VALIDITY_MINUTES * 60 * 1000),
    gatewayTransactionId: prn,
  }
}

export async function verifyFonepayTransaction(
  config: FonepayConfig,
  {
    prn,
    expectedAmountInPaisa,
  }: {
  prn: string
  // Required, not optional — without this, a "success" status on this PRN
  // was being accepted regardless of what amount actually cleared. This is
  // the fix for that gap.
  expectedAmountInPaisa: number
  },
): Promise<VerifyPaymentResult> {
  const signature = buildFonepayStatusSignature(config, prn)
  const response = await fetch(`${config.baseUrl}/thirdPartyDynamicQrGetStatus`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prn,
      merchantCode: config.merchantCode,
      dataValidation: signature,
      username: config.username,
      password: config.password,
    }),
  })
  if (!response.ok) {
    return { verified: false, status: "failed", gatewayTransactionId: null, amountInPaisa: null, raw: await response.text() }
  }
  const data = (await response.json()) as FonepayStatusResponse
  const statusOk = data.paymentStatus === "success"

  const actualAmountInPaisa =
    data.amount != null ? Math.round(parseFloat(data.amount) * 100) : null

  // The real fix: statusOk alone used to be treated as verified. Now a
  // successful status with a mismatched (or missing) amount is explicitly
  // NOT verified — this is what stops a smaller real payment on this PRN
  // from being accepted as payment for a larger purchase.
  const amountOk =
    actualAmountInPaisa != null && actualAmountInPaisa === expectedAmountInPaisa

  const verified = statusOk && amountOk

  return {
    verified,
    status: verified
      ? "completed"
      : statusOk && !amountOk
        ? "failed" // status says success but amount doesn't match — treat as failed, not pending
        : data.paymentStatus === "pending"
          ? "pending"
          : "failed",
    gatewayTransactionId: data.prn,
    amountInPaisa: actualAmountInPaisa,
    raw: data,
  }
}

export const createFonepayGateway = (config: FonepayConfig): PaymentGateway => ({
  async initiate({ purchaseId, amountInPaisa, productName }) {
    return generateFonepayQr(config, { purchaseId, amountInPaisa, productName })
  },
  async verify({ gatewayCheckoutId, gatewayTransactionId, amountInPaisa }) {
    const prn = gatewayTransactionId ?? gatewayCheckoutId
    return verifyFonepayTransaction(config, { prn, expectedAmountInPaisa: amountInPaisa })
  },
})
