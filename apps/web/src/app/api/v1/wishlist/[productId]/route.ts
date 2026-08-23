// apps/web/src/app/api/v1/wishlist/[productId]/route.ts
import { NextResponse } from "next/server"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { removeFromWishlist } from "@/features/wishlist/db/wishlist"

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ productId: string }> },
) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }
  const { productId } = await params
  await removeFromWishlist({ userId: session.user.id, productId })
  return NextResponse.json({ ok: true })
}
