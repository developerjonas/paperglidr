"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { initiatePurchase } from "../actions/purchases"

const gatewayOptions = [
  { value: "esewa", label: "Pay with eSewa" },
  { value: "khalti", label: "Pay with Khalti" },
] as const

export function PurchaseGatewayPicker({ productId }: { productId: string }) {
  const [isPending, setIsPending] = useState<string | null>(null)
  const router = useRouter()

  async function handleSelect(gateway: (typeof gatewayOptions)[number]["value"]) {
    setIsPending(gateway)
    const result = await initiatePurchase({ productId, gateway })

    if (result.error || result.redirectUrl == null) {
      setIsPending(null)
      // TODO: surface result.message via your toast system — actionToast
      // expects the { error, message } shape this already returns
      return
    }

    if (result.formFields != null) {
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

    // Khalti: plain redirect, no form needed
    router.push(result.redirectUrl)
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
          {isPending === option.value ? "Redirecting..." : option.label}
        </Button>
      ))}
    </div>
  )
}
