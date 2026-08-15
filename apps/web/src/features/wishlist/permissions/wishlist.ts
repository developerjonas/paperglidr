// Destination: apps/web/src/features/wishlist/permissions/wishlist.ts
//
// Mirrors the shape used by canCreateCourseReview etc. — adjust the
// currentUser type here if getCurrentUser() returns a different shape
// in your services/clerk.ts (or its Better Auth equivalent).

export function canManageWishlist(currentUser: {
  userId: string | undefined | null;
}): currentUser is { userId: string } {
  return currentUser.userId != null;
}
