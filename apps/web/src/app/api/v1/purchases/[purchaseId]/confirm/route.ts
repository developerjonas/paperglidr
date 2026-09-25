import { apiError, apiJson, isUuid, requireApiUser, v1Route } from "@/lib/api/v1"
import { confirmPurchase } from "@/features/purchases/actions/purchases"

/**
 * Asks the gateway about a checkout and grants access if it's paid — the
 * web success page's action. Call it when the payment WebView returns, and
 * poll it (every few seconds) for a Fonepay QR. `status`:
 *   "completed"  paid; the courses are in GET /api/v1/me/courses
 *   "pending"    not settled yet; ask again shortly
 *   "failed"     not paid; start a new checkout
 */
export const POST = v1Route<{ purchaseId: string }>("confirm purchase", async (_req, { params }) => {
  const gate = await requireApiUser()
  if (!gate.ok) return gate.response
  const { purchaseId } = await params
  if (!isUuid(purchaseId)) return apiError(404, "Purchase not found")

  const result = await confirmPurchase({ purchaseId })
  if (result.status === "not_found") return apiError(404, "Purchase not found")
  return apiJson({ status: result.status, message: result.message })
})
