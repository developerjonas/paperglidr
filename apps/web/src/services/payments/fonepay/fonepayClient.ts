import crypto from "crypto"

const FONEPAY_MERCHANT_CODE = process.env.FONEPAY_MERCHANT_CODE!
const FONEPAY_SECRET_KEY = process.env.FONEPAY_SECRET_KEY!
const FONEPAY_USERNAME = process.env.FONEPAY_USERNAME!
const FONEPAY_PASSWORD = process.env.FONEPAY_PASSWORD!
const FONEPAY_DYNAMIC_QR_URL =
  process.env.FONEPAY_DYNAMIC_QR_URL ?? "https://dev-clientapi.fonepay.com/api/merchant/merchantDetailsForThirdParty"

function hmacSha512(message: string) {
  return crypto.createHmac("sha512", FONEPAY_SECRET_KEY).update(message).digest("hex")
}

/**
 * PRN (Product Reference Number) must be unique per QR request — reused
 * across the same purchase.id you already generate elsewhere, consistent
 * with how eSewa's transaction_uuid reuses purchase.id too.
 */
export function buildFonepayQrSignature({
  amountInPaisa,
  prn,
  remarks1,
  remarks2,
}: {
  amountInPaisa: number
  prn: string
  remarks1: string
  remarks2: string
}) {
  // Fonepay's amount field is a decimal string in rupees, not paisa —
  // same rupee/paisa boundary issue as eSewa, isolated to this file only
  const amount = (amountInPaisa / 100).toFixed(2)
  const message = `${amount},${prn},${FONEPAY_MERCHANT_CODE},${remarks1},${remarks2}`
  return { amount, signature: hmacSha512(message) }
}

export function buildFonepayStatusSignature(prn: string) {
  const message = `${prn},${FONEPAY_MERCHANT_CODE}`
  return hmacSha512(message)
}

export const fonepayConfig = {
  merchantCode: FONEPAY_MERCHANT_CODE,
  username: FONEPAY_USERNAME,
  password: FONEPAY_PASSWORD,
  dynamicQrUrl: FONEPAY_DYNAMIC_QR_URL,
}
