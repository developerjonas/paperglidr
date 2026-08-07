import type { PaymentGateway, VerifyPaymentResult, InitiatePaymentResult } from "../types"
import { buildFonepayQrSignature, buildFonepayStatusSignature, fonepayConfig } from "./fonepayClient"

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

export async function generateFonepayQr({
  purchaseId,
  amountInPaisa,
  productName,
}: {
  purchaseId: string
  amountInPaisa: number
  productName: string
}): Promise<InitiatePaymentResult> {
  const prn = purchaseId
  const remarks1 = productName.slice(0, 160) // Fonepay's R1 field has a max length
  const remarks2 = "Paperglidr purchase"

  const { amount, signature } = buildFonepayQrSignature({
    amountInPaisa,
    prn,
    remarks1,
    remarks2,
  })

  const response = await fetch(`${fonepayConfig.dynamicQrUrl}/thirdPartyDynamicQrDownload`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      amount,
      prn,
      merchantCode: fonepayConfig.merchantCode,
      dataValidation: signature,
      username: fonepayConfig.username,
      password: fonepayConfig.password,
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

export async function verifyFonepayTransaction({
  prn,
}: {
  prn: string
}): Promise<VerifyPaymentResult> {
  const signature = buildFonepayStatusSignature(prn)

  const response = await fetch(`${fonepayConfig.dynamicQrUrl}/thirdPartyDynamicQrGetStatus`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prn,
      merchantCode: fonepayConfig.merchantCode,
      dataValidation: signature,
      username: fonepayConfig.username,
      password: fonepayConfig.password,
    }),
  })

  if (!response.ok) {
    return { verified: false, status: "failed", gatewayTransactionId: null, amountInPaisa: null, raw: await response.text() }
  }

  const data = (await response.json()) as FonepayStatusResponse
  const isComplete = data.paymentStatus === "success"

  return {
    verified: isComplete,
    status: isComplete ? "completed" : data.paymentStatus === "pending" ? "pending" : "failed",
    gatewayTransactionId: data.prn,
    amountInPaisa: data.amount != null ? Math.round(parseFloat(data.amount) * 100) : null,
    raw: data,
  }
}

export const fonepayGateway: PaymentGateway = {
  async initiate({ purchaseId, amountInPaisa, productName }) {
    return generateFonepayQr({ purchaseId, amountInPaisa, productName })
  },
  async verify({ gatewayCheckoutId, gatewayTransactionId }) {
    const prn = gatewayTransactionId ?? gatewayCheckoutId
    return verifyFonepayTransaction({ prn })
  },
}
