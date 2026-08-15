// Destination: apps/web/src/features/wishlist/db/wishlist.ts

import { db } from "@/drizzle/db";
import { WishlistTable } from "@/drizzle/schema";
import { and, eq } from "drizzle-orm";
import { cacheTag } from "next/dist/server/use-cache/cache-tag";
import { revalidateWishlistCache, getWishlistUserTag } from "./cache";

export async function addToWishlist(userId: string, productId: string) {
  const [item] = await db
    .insert(WishlistTable)
    .values({ userId, productId })
    .onConflictDoNothing()
    .returning();
  revalidateWishlistCache({ userId });
  return item;
}

export async function removeFromWishlist(userId: string, productId: string) {
  const [deleted] = await db
    .delete(WishlistTable)
    .where(
      and(
        eq(WishlistTable.userId, userId),
        eq(WishlistTable.productId, productId),
      ),
    )
    .returning();
  revalidateWishlistCache({ userId });
  return deleted;
}

export async function getWishlistForUser(userId: string) {
  "use cache";
  cacheTag(getWishlistUserTag(userId));
  return db.query.WishlistTable.findMany({
    where: (wishlist, { eq }) => eq(wishlist.userId, userId),
    orderBy: (wishlist, { desc }) => desc(wishlist.createdAt),
    // Adjust relation name/columns below to match your ProductTable
    // relations (I don't have product.ts — this assumes a `product`
    // relation exists on WishlistTable, which the schema file sets up).
    with: { product: true },
  });
}

// Deliberately NOT cached with "use cache" — this backs the per-user
// heart-icon toggle state, so mixing it into a shared cache tag would
// leak one user's wishlist status into another user's request.
export async function isProductWishlisted(userId: string, productId: string) {
  const item = await db.query.WishlistTable.findFirst({
    where: (wishlist, { and, eq }) =>
      and(eq(wishlist.userId, userId), eq(wishlist.productId, productId)),
  });
  return item != null;
}
