// apps/web/src/app/api/v1/products/route.ts
import { NextResponse } from "next/server"
import { getPublicProductListings } from "@/features/products/db/products"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const limitParam = searchParams.get("limit")
  const products = await getPublicProductListings({
    limit: limitParam ? Number(limitParam) : undefined,
  })
  return NextResponse.json(products)
}
