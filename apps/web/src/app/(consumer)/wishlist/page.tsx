import { redirect } from "next/navigation";
import { getCurrentUser } from "@/services/auth";
import { getWishlistForUser } from "@/features/wishlist/db/wishlist";
import { ProductCard } from "@/features/products/components/ProductCard";
import { PageHeader } from "@/components/PageHeader";

export default async function WishlistPage() {
  const currentUser = await getCurrentUser();
  if (currentUser.userId == null) redirect("/sign-in");

  const items = await getWishlistForUser(currentUser.userId);

  return (
    <div className="container my-6">
      <PageHeader title="My Wishlist" />

      {items.length === 0 ? (
        <p className="text-muted-foreground mt-4">
          You haven&apos;t saved any courses yet.
        </p>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <ProductCard
              key={item.id}
              id={item.product.id}
              imageUrl={item.product.imageUrl}
              name={item.product.name}
              priceInRupees={item.product.priceInRupees}
              description={item.product.description}
              isWishlisted
            />
          ))}
        </div>
      )}
    </div>
  );
}
