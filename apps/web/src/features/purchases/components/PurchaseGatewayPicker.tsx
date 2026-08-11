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
  const [activeQr, setActiveQr] = useState<{
    purchaseId: string
    qrDataUrl: string
    expiresAt: Date
  } | null>(null)
  const router = useRouter()

  useEffect(() => {
    if (activeQr == null) return
    const interval = setInterval(async () => {
      const result = await confirmPurchase({ purchaseId: activeQr.purchaseId })
      if (!result.error) {
        clearInterval(interval)
        router.push(
          `/products/${productId}/purchase/success?purchaseId=${activeQr.purchaseId}`
        )
      }
    }, 3000)
    return () => clearInterval(interval)
  }, [activeQr, productId, router])

  async function handleSelect(
    gateway: (typeof gatewayOptions)[number]["value"]
  ) {
    setIsPending(gateway)
    const idempotencyKey = crypto.randomUUID()

    const result = await initiatePurchase({
      productId,
      gateway,
      idempotencyKey,
    })

    if (result.error) {
      setIsPending(null)
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

    // 3. Fallback for direct redirect URLs
    if (result.redirectUrl != null) {
      window.location.href = result.redirectUrl
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
