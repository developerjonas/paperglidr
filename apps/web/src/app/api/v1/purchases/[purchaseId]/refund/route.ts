import { z } from "zod"
import { actionResponse, apiError, apiJson, isUuid, readJson, requireApiUser, v1Route } from "@/lib/api/v1"
import { checkMyRefundEligibility, requestRefund } from "@/features/refunds/actions/refunds"

type Params = { purchaseId: string }

/**
 * Whether the purchase can be refunded right now: { eligible, msRemaining,
 * completionPercent, openRequestStatus }. The rule is in /refund-policy.
 */
export const GET = v1Route<Params>("refund eligibility", async (_req, { params }) => {
  const gate = await requireApiUser()
  if (!gate.ok) return gate.response
  const { purchaseId } = await params
  if (!isUuid(purchaseId)) return apiError(404, "Purchase not found")

  const result = await checkMyRefundEligibility(purchaseId)
  if (result.error) return apiError(404, result.message)
  return apiJson({ ...result.eligibility, openRequestStatus: result.openRequestStatus })
})

/** Request a refund. Body: { reason? } — up to 2000 characters. */
export const POST = v1Route<Params>("request refund", async (req, { params }) => {
  const gate = await requireApiUser()
  if (!gate.ok) return gate.response
  const { purchaseId } = await params
  if (!isUuid(purchaseId)) return apiError(404, "Purchase not found")

  const input = await readJson(req, z.object({ reason: z.string().max(2000).optional() }))
  if (!input.ok) return input.response

  const result = await requestRefund(purchaseId, input.data.reason)
  return actionResponse(result, { successStatus: 201 })
})
