import crypto from "crypto"
import type { FonepayConfig } from "../config"

function hmacSha512(secretKey: string, message: string) {
  return crypto.createHmac("sha512", secretKey).update(message).digest("hex")
}

/**
 * PRN (Product Reference Number) must be unique per QR request — reused
 * across the same purchase.id you already generate elsewhere, consistent
 * with how eSewa's transaction_uuid reuses purchase.id too.
 */
export function buildFonepayQrSignature(
  config: FonepayConfig,
  {
    amountInPaisa,
    prn,
    remarks1,
    remarks2,
  }: {
    amountInPaisa: number
    prn: string
    remarks1: string
    remarks2: string
  },
) {
  // Fonepay's amount field is a decimal string in rupees, not paisa —
  // same rupee/paisa boundary issue as eSewa, isolated to this file only
  const amount = (amountInPaisa / 100).toFixed(2)
  const message = `${amount},${prn},${config.merchantCode},${remarks1},${remarks2}`
  return { amount, signature: hmacSha512(config.secretKey, message) }
}

export function buildFonepayStatusSignature(config: FonepayConfig, prn: string) {
  return hmacSha512(config.secretKey, `${prn},${config.merchantCode}`)
}
