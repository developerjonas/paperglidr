"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import QRCode from "qrcode"
import { Button } from "@/components/ui/button"
import type { GatewayName } from "@/services/payments/config"
import { initiatePurchase } from "../actions/purchases"
const gatewayLabels: Record<GatewayName, string> = {
  esewa: "Pay with eSewa",
  khalti: "Pay with Khalti",
  fonepay: "Pay with Fonepay QR",
}
export function PurchaseGatewayPicker({
  productId,
  discountCode,
  gateways,
}: {
  productId: string
  discountCode?: string
  // Only the gateways enabled in this deployment — computed server-side.
  gateways: GatewayName[]
}) {
  const [isPending, setIsPending] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  // One checkout attempt per mount: retries and double clicks reuse the
  // same purchase. The parent remounts this component (via `key`) when the
  // discount code changes.
  const [checkoutId] = useState(() => crypto.randomUUID())
  const [activeQr, setActiveQr] = useState<{
    purchaseId: string
    qrDataUrl: string
    expiresAt: Date
  } | null>(null)
  const router = useRouter()
  useEffect(() => {
    if (activeQr == null) return
    const interval = setInterval(async () => {
      if (Date.now() > activeQr.expiresAt.getTime()) {
        // QR expired: stop polling; the reconciliation cron settles it.
        clearInterval(interval)
        router.push(`/products/purchase-failure?purchaseId=${activeQr.purchaseId}`)
        return
      }
      const response = await fetch(
        `/api/payments/fonepay/status/${activeQr.purchaseId}`,
        { cache: "no-store" }
      ).catch(() => null)
      const body = response?.ok ? await response.json() : null
      if (body?.status === "completed") {
        clearInterval(interval)
        router.push(
          `/products/${productId}/purchase/success?purchaseId=${activeQr.purchaseId}`
        )
      } else if (body?.status === "failed") {
        clearInterval(interval)
        router.push(`/products/purchase-failure?purchaseId=${activeQr.purchaseId}`)
      }
    }, 3000)
    return () => clearInterval(interval)
  }, [activeQr, productId, router])
  async function handleSelect(gateway: GatewayName) {
    setIsPending(gateway)
    setError(null)
    const idempotencyKey = `${checkoutId}:${gateway}`
    const result = await initiatePurchase({
      productId,
      gateway,
      idempotencyKey,
      discountCode,
    })
    if (result.error) {
      setIsPending(null)
      setError(result.message ?? "Could not start the payment. Please try again.")
      return
    }
    // 1. Handle QR payment flow (Fonepay)
    if (result.qr != null) {
      const qrDataUrl = await QRCode.toDataURL(result.qr.qrString)
      setActiveQr({
        purchaseId: result.purchaseId,
        qrDataUrl,
        expiresAt: result.qr.expiresAt,
      })
      setIsPending(null)
      return
    }
    // 2. Handle Redirect/Form POST payment flow (eSewa / Khalti via result.redirect)
    if (result.redirect != null) {
      if (result.redirect.method === "POST" && result.redirect.formFields) {
        const form = document.createElement("form")
        form.method = "POST"
        form.action = result.redirect.url
        for (const [key, value] of Object.entries(result.redirect.formFields)) {
          const input = document.createElement("input")
          input.type = "hidden"
          input.name = key
          input.value = String(value)
          form.appendChild(input)
        }
        document.body.appendChild(form)
        form.submit()
        return
      }
      if (result.redirect.url) {
        window.location.href = result.redirect.url
        return
      }
    }
  }
  if (activeQr != null) {
    return (
      <div className="flex flex-col items-center gap-3 w-full">
        <Image
          src={activeQr.qrDataUrl}
          alt="Fonepay QR"
          width={220}
          height={220}
        />
        <p className="text-sm text-muted-foreground">
          Scan with any Fonepay-supported banking app
        </p>
        <p className="text-xs text-muted-foreground">Waiting for payment...</p>
      </div>
    )
  }
  if (gateways.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Payments are temporarily unavailable.{" "}
        <Link href="/support/new" className="underline underline-offset-4">
          Contact support
        </Link>
      </p>
    )
  }
  return (
    <div className="flex flex-col gap-2 w-full">
      {gateways.map(gateway => (
        <Button
          key={gateway}
          size="lg"
          className="w-full"
          disabled={isPending != null}
          onClick={() => handleSelect(gateway)}
        >
          {isPending === gateway ? "Loading..." : gatewayLabels[gateway]}
        </Button>
      ))}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
