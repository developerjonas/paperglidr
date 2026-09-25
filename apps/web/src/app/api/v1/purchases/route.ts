// apps/web/src/app/api/v1/purchases/route.ts
import { apiJson, requireApiUser, v1Route } from "@/lib/api/v1"
import { getPurchasesForUser } from "@/features/purchases/db/purchases"

// The user's purchases, newest first. Detail: GET /api/v1/purchases/[id].
export const GET = v1Route("purchases", async () => {
  const gate = await requireApiUser()
  if (!gate.ok) return gate.response

  const purchases = await getPurchasesForUser(gate.user.userId)
  return apiJson(
    purchases.map(p => ({
      id: p.id,
      status: p.status,
      gateway: p.gateway,
      productId: p.productId,
      name: p.productDetails.name,
      description: p.productDetails.description,
      imageUrl: p.productDetails.imageUrl,
      pricePaidInPaisa: p.pricePaidInPaisa,
      createdAt: p.createdAt,
      refundedAt: p.refundedAt,
    })),
  )
})
