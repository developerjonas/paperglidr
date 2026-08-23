// apps/web/src/app/api/v1/products/[productId]/route.ts
import { NextResponse } from "next/server";
import { getPublicProductDetail } from "@/features/products/db/products";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ productId: string }> },
) {
  const { productId } = await params;
  const product = await getPublicProductDetail(productId);
  if (!product) {
    return NextResponse.json({ message: "Product not found" }, { status: 404 });
  }
  return NextResponse.json(product);
}
