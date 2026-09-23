import type { FonepayConfig } from "../config"
import {
  errorResult,
  rupeesToPaisa,
  type GatewayPaymentStatus,
  type InitiatePaymentResult,
  type PaymentGateway,
  type VerifyPaymentResult,
} from "../types"
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
    checkoutId: prn,
  }
}

export async function verifyFonepayTransaction(
  config: FonepayConfig,
  { prn }: { prn: string },
): Promise<VerifyPaymentResult> {
  const signature = buildFonepayStatusSignature(config, prn)
  const response = await fetch(`${config.baseUrl}/thirdPartyDynamicQrGetStatus`, {
    method: "POST",
    cache: "no-store",
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
    return errorResult({ httpStatus: response.status, body: await response.text() })
  }
  const data = (await response.json()) as FonepayStatusResponse
  if (data.prn !== prn) {
    return errorResult({ reason: "status response mismatch", data })
  }
  // The amount is reported, not judged here: verifyAndFulfil compares it to
  // the purchase for every gateway in one place.
  return {
    status: STATUS_MAP[data.paymentStatus] ?? "error",
    amountInPaisa: rupeesToPaisa(data.amount),
    gatewayTransactionId: data.fonepayTraceId != null ? String(data.fonepayTraceId) : null,
    gatewayStatus: data.paymentStatus,
    raw: data,
  }
}

const STATUS_MAP: Record<string, GatewayPaymentStatus> = {
  success: "completed",
  pending: "pending",
  failed: "failed",
  expired: "failed",
}

export const createFonepayGateway = (config: FonepayConfig): PaymentGateway => ({
  async initiate({ purchaseId, amountInPaisa, productName }) {
    return generateFonepayQr(config, { purchaseId, amountInPaisa, productName })
  },
  async verify({ purchaseId }) {
    // The PRN is the purchase id (see generateFonepayQr).
    return verifyFonepayTransaction(config, { prn: purchaseId })
  },
})
