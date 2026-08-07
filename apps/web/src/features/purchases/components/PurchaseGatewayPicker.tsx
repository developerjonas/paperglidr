"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import QRCode from "qrcode"
import { Button } from "@/components/ui/button"
import { initiatePurchase, confirmPurchase } from "../actions/purchases"

const gatewayOptions = [
  { value: "esewa", label: "Pay with eSewa" },
  { value: "khalti", label: "Pay with Khalti" },
  { value: "fonepay", label: "Pay with Fonepay QR" },
] as const

export function PurchaseGatewayPicker({ productId }: { productId: string }) {
  const [isPending, setIsPending] = useState<string | null>(null)
  const [activeQr, setActiveQr] = useState<{ purchaseId: string; qrDataUrl: string; expiresAt: Date } | null>(null)
  const router = useRouter()

  // No redirect callback exists for Fonepay QR — this is the only way the
  // UI finds out a scan succeeded, so it polls confirmPurchase while a QR
  // is on screen and stops once it resolves.
  useEffect(() => {
    if (activeQr == null) return
    const interval = setInterval(async () => {
      const result = await confirmPurchase({ purchaseId: activeQr.purchaseId })
      if (!result.error) {
        clearInterval(interval)
        router.push(`/products/${productId}/purchase/success?purchaseId=${activeQr.purchaseId}`)
      }
    }, 3000)
    return () => clearInterval(interval)
  }, [activeQr, productId, router])

  async function handleSelect(gateway: (typeof gatewayOptions)[number]["value"]) {
    setIsPending(gateway)
    const result = await initiatePurchase({ productId, gateway })

    if (result.error) {
      setIsPending(null)
      // TODO: surface result.message via your toast system — actionToast
      // expects the { error, message } shape this already returns
      return
    }

    if (result.qr != null) {
      const qrDataUrl = await QRCode.toDataURL(result.qr.qrString)
      setActiveQr({ purchaseId: result.qr.purchaseId, qrDataUrl, expiresAt: result.qr.expiresAt })
      setIsPending(null)
      return
    }

    if (result.formFields != null && result.redirectUrl != null) {
      // eSewa: build and auto-submit a real POST form — this can't be a
      // fetch/redirect, eSewa requires the browser to navigate via POST
      // with these exact signed fields
      const form = document.createElement("form")
      form.method = "POST"
      form.action = result.redirectUrl
      for (const [key, value] of Object.entries(result.formFields)) {
        const input = document.createElement("input")
        input.type = "hidden"
        input.name = key
        input.value = value
        form.appendChild(input)
      }
      document.body.appendChild(form)
      form.submit()
      return
    }

    if (result.redirectUrl != null) {
      // Khalti: plain redirect, no form needed
      router.push(result.redirectUrl)
    }
  }

  if (activeQr != null) {
    return (
      <div className="flex flex-col items-center gap-3 w-full">
        <Image src={activeQr.qrDataUrl} alt="Fonepay QR" width={220} height={220} />
        <p className="text-sm text-muted-foreground">Scan with any Fonepay-supported banking app</p>
        <p className="text-xs text-muted-foreground">Waiting for payment...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2 w-full">
      {gatewayOptions.map(option => (
        <Button
          key={option.value}
          size="lg"
          className="w-full"
          disabled={isPending != null}
          onClick={() => handleSelect(option.value)}
        >
          {isPending === option.value ? "Loading..." : option.label}
        </Button>
      ))}
    </div>
  )
}
