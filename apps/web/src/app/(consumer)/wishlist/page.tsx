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
      <section className="relative overflow-hidden border-b border-white/10 bg-gradient-to-b from-primary/5 via-background to-background py-14 md:py-20">
        <div className="absolute top-0 left-1/2 -z-10 h-[280px] w-[480px] -translate-x-1/2 rounded-full bg-primary/10 blur-[120px]" />
        <div className="container mx-auto px-4">
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
            My Wishlist
          </h1>
        </div>
      </section>

      {/* ---------------- CONTENT ---------------- */}
      <section className="container mx-auto px-4 py-10">
        {items.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-white/30 bg-white/30 p-10 text-center backdrop-blur-md dark:border-white/10 dark:bg-white/[0.02]">
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
