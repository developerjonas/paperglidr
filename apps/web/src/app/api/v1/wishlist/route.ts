// apps/web/src/app/api/v1/wishlist/route.ts
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import {
  getWishlistForUser,
  addToWishlist,
} from "@/features/wishlist/db/wishlist";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const items = await getWishlistForUser(session.user.id);

  return NextResponse.json(
    items.map((item) => ({
      wishlistItemId: item.id,
      productId: item.productId,
      name: item.product.name,
      description: item.product.description,
      imageUrl: item.product.imageUrl,
      priceInRupees: item.product.priceInRupees,
      addedAt: item.createdAt,
    })),
  );
}

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const { productId } = await req.json();
  if (!productId) {
    return NextResponse.json(
      { message: "productId is required" },
      { status: 400 },
    );
  }
  await addToWishlist({ userId: session.user.id, productId });
  return NextResponse.json({ ok: true });
}
