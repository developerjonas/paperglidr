"use client"

import { useState } from "react"
import { PromoCodeInput } from "@/features/discounts/components/PromoCodeInput"
import { PurchaseGatewayPicker } from "./PurchaseGatewayPicker"
import { formatPrice } from "@/lib/formatters"

export function PurchaseCheckoutCard({
  productId,
  priceInRupees,
}: {
  productId: string
  priceInRupees: number
}) {
  const [discount, setDiscount] = useState<{
    code: string
    amountOffInRupees: number
  } | null>(null)

  const finalPriceInRupees = Math.max(
    0,
    priceInRupees - (discount?.amountOffInRupees ?? 0),
  )

  return (
    <div className="flex flex-col gap-4">
      {discount ? (
        <div className="flex items-baseline gap-2">
          <span className="text-lg font-semibold">
            {formatPrice(finalPriceInRupees)}
          </span>
          <span className="text-sm text-muted-foreground line-through">
            {formatPrice(priceInRupees)}
          </span>
        </div>
      ) : (
        <p className="text-lg font-semibold">{formatPrice(priceInRupees)}</p>
      )}

      <PromoCodeInput
        productId={productId}
        priceInRupees={priceInRupees}
        onApplied={setDiscount}
      />

      {/* ADJUST: PurchaseGatewayPicker's real implementation hasn't been
          seen — it needs a new optional `discountCode` prop, threaded
          into whatever it passes to initiatePurchase server-side. Without
          that, this widget shows a discounted price but never actually
          applies it to the charge. */}
      <PurchaseGatewayPicker productId={productId} discountCode={discount?.code} />
    </div>
  )
}
