"use client"

import { useState } from "react"
import { PromoCodeInput } from "@/features/discounts/components/PromoCodeInput"
import { PurchaseGatewayPicker } from "./PurchaseGatewayPicker"
import { formatPrice } from "@/lib/formatters"
import type { GatewayName } from "@/services/payments/config"

export function PurchaseCheckoutCard({
  productId,
  priceInRupees,
  gateways,
  testMode,
}: {
  productId: string
  priceInRupees: number
  gateways: GatewayName[]
  testMode: boolean
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

      {testMode && (
        <p
          role="status"
          className="rounded-[5px] border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm font-medium text-amber-700 dark:text-amber-300"
        >
          TEST MODE — no real money. Payments go to gateway sandboxes.
        </p>
      )}

      <PurchaseGatewayPicker
        key={discount?.code ?? "no-discount"}
        productId={productId}
        discountCode={discount?.code}
        gateways={gateways}
      />
    </div>
  )
}
