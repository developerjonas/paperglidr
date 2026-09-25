import { redirect } from "next/navigation";
import { getCurrentUser } from "@/services/auth";
import { getWishlistForUser } from "@/features/wishlist/db/wishlist";
import { ProductCard } from "@/features/products/components/ProductCard";

export default async function WishlistPage() {
  const currentUser = await getCurrentUser();
  if (currentUser.userId == null) redirect("/sign-in");

  const items = await getWishlistForUser(currentUser.userId);

  return (
    <div className="flex flex-col min-h-screen">
      {/* ---------------- HERO ---------------- */}
      <section className="relative overflow-hidden section-muted border-b py-14 md:py-20">
        <div className="container mx-auto px-4">
          <h1 className="heading-display text-3xl sm:text-4xl">
            My Wishlist
          </h1>
        </div>
      </section>

      {/* ---------------- CONTENT ---------------- */}
      <section className="container mx-auto px-4 py-10">
        {items.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border bg-secondary/40 p-10 text-center">
            <p className="text-sm text-muted-foreground">
              You haven&apos;t saved any courses yet.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
      </section>
    </div>
  );
}
