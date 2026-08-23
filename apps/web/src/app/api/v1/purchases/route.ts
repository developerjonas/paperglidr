// apps/web/src/app/api/v1/purchases/route.ts
import { NextResponse } from "next/server"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { getPurchasesForUser } from "@/features/purchases/db/purchases"

export async function GET() {
  // auth.api.getSession reads both the cookie (web) and the Authorization
  // bearer header (mobile) — same check either client uses.
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  const purchases = await getPurchasesForUser(session.user.id)

  return NextResponse.json(
    purchases.map(p => ({
      id: p.id,
      status: p.status,
      gateway: p.gateway,
      productId: p.productId, // TODO: verify column name
      name: p.productDetails.name,
      description: p.productDetails.description,
      imageUrl: p.productDetails.imageUrl,
      priceInRupeesPaid: p.pricePaidInPaisa, // TODO: verify column name
      createdAt: p.createdAt,
    })),
  )
}
