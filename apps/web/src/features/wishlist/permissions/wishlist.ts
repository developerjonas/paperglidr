// Destination: apps/web/src/features/wishlist/permissions/wishlist.ts
//
// Mirrors the shape used by canCreateCourseReview etc.

export function canManageWishlist(currentUser: {
  userId: string | undefined | null;
}): currentUser is { userId: string } {
  return currentUser.userId != null;
}
