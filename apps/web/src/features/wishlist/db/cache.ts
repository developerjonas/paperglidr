// Destination: apps/web/src/features/wishlist/db/cache.ts
//
// NOTE: also add "wishlist" to the CACHE_TAG union in lib/dataCache.ts,
// e.g.:
//   type CACHE_TAG = | "products" | ... | "reviews" | "wishlist";

import { getGlobalTag, getUserTag } from "@/lib/dataCache";
import { revalidateTag } from "next/cache";

export function getWishlistGlobalTag() {
  return getGlobalTag("wishlist");
}

export function getWishlistUserTag(userId: string) {
  return getUserTag("wishlist", userId);
}

export function revalidateWishlistCache({ userId }: { userId: string }) {
  revalidateTag(getWishlistGlobalTag());
  revalidateTag(getWishlistUserTag(userId));
}
