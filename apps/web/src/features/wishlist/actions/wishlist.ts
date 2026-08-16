// Destination: apps/web/src/features/wishlist/actions/wishlist.ts

"use server";

import { getCurrentUser } from "@/services/auth";
import { canManageWishlist } from "../permissions/wishlist";
import {
  addToWishlist,
  removeFromWishlist,
  isProductWishlisted,
} from "../db/wishlist";

export async function toggleWishlist(productId: string) {
  const currentUser = await getCurrentUser();
  if (!canManageWishlist(currentUser)) {
    return {
      error: true,
      message: "You need to sign in to save courses",
      isWishlisted: false,
    };
  }

  const alreadySaved = await isProductWishlisted(currentUser.userId, productId);

  if (alreadySaved) {
    await removeFromWishlist(currentUser.userId, productId);
    return {
      error: false,
      message: "Removed from wishlist",
      isWishlisted: false,
    };
  }

  await addToWishlist(currentUser.userId, productId);
  return { error: false, message: "Added to wishlist", isWishlisted: true };
}
