import { z } from "zod"
import { apiError, apiJson, readJson, requireApiUser, v1Route } from "@/lib/api/v1"
import { initiatePurchase } from "@/features/purchases/actions/purchases"
import { GATEWAY_NAMES } from "@/services/payments/config"

const checkoutSchema = z.object({
  productId: z.string().uuid(),
  gateway: z.enum(GATEWAY_NAMES),
  // One random UUID per checkout screen, reused on retries: a double tap
  // or a retried request returns the same purchase instead of a second one.
  checkoutId: z.string().uuid(),
  discountCode: z.string().trim().min(1).max(64).optional(),
})

/**
 * Starts a checkout — the web checkout's server action, so price,
 * discount, ownership and gateway checks are identical. `next` says what
 * the app does now:
 *   { type: "redirect", url, method, formFields }  open the gateway in a
 *       WebView (POST: submit formFields as a form). When the WebView
 *       navigates back to the site (config.siteUrl), close it and call
 *       POST /api/v1/purchases/[purchaseId]/confirm.
 *   { type: "qr", qrString, expiresAt }  Fonepay: render the QR and poll
 *       POST /api/v1/purchases/[purchaseId]/confirm until it's final.
 *   { type: "enrolled" }  a 100% discount: access is already granted.
 */
export const POST = v1Route("checkout", async req => {
  const gate = await requireApiUser()
  if (!gate.ok) return gate.response

  const input = await readJson(req, checkoutSchema)
  if (!input.ok) return input.response
  const { productId, gateway, checkoutId, discountCode } = input.data

  const result = await initiatePurchase({
    productId,
    gateway,
    idempotencyKey: `${checkoutId}:${gateway}`,
    discountCode,
  })
  if (result.error) return apiError(400, result.message)

  if (result.purchaseId == null) {
    return apiJson({ purchaseId: null, next: { type: "enrolled" } }, 201)
  }
  if (result.qr != null) {
    return apiJson(
      {
        purchaseId: result.purchaseId,
        next: { type: "qr", qrString: result.qr.qrString, expiresAt: result.qr.expiresAt },
      },
      201,
    )
  }
  return apiJson(
    {
      purchaseId: result.purchaseId,
      next: {
        type: "redirect",
        url: result.redirect.url,
        method: result.redirect.method,
        formFields: result.redirect.formFields ?? null,
      },
    },
    201,
  )
})
