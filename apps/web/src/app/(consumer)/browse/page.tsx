import Link from "next/link";
import { BookOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ProductCard } from "@/features/products/components/ProductCard";
import { searchProducts } from "@/features/search/db/search";
import { SearchBar } from "@/features/search/components/SearchBar";
import { Suspense } from "react";
import { db } from "@/drizzle/db";
import { CategoryTable } from "@/drizzle/schema";
import { asc } from "drizzle-orm";

export default async function BrowsePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  const { q, category } = await searchParams;
  const query = q?.trim() ?? "";
  const currentCategory = category ?? "all";

  const categories = await db.query.CategoryTable.findMany({
    orderBy: asc(CategoryTable.name),
  });

  // resolve slug -> id, since the search layer filters by categoryId
  const categoryId =
    currentCategory !== "all"
      ? categories.find((c) => c.slug === currentCategory)?.id
      : undefined;

  const results = await searchProducts({
    q: query || undefined,
    categoryId,
    sort: "relevance",
    page: 1,
  });

  return (
    <div className="flex flex-col min-h-screen">
      <section className="border-b border-white/10 bg-gradient-to-b from-primary/5 via-background to-background py-10 md:py-14">
        <div className="container mx-auto px-4">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Browse Courses
          </h1>
          <p className="mt-1 text-sm text-muted-foreground sm:text-base">
            Find the right course by title, topic, or category.
          </p>
        </div>
        <div className="mt-6 md:hidden">
          <Suspense
            fallback={
              <div className="h-10 w-full animate-pulse rounded-[5px] bg-muted" />
            }
          >
            <SearchBar autoFocus />
          </Suspense>
        </div>
      </section>

      {/* Dynamic Category Filtering Bar */}
      <section className="sticky top-16 z-20 border-b border-white/10 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
            <Link
              href={`/browse${query ? `?q=${encodeURIComponent(query)}` : ""}`}
              className={`inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium transition-all ${
                currentCategory === "all"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              All Courses
            </Link>
            {categories.map((cat) => {
              const isActive = currentCategory === cat.slug;
              const searchParamsObj = new URLSearchParams();
              if (query) searchParamsObj.set("q", query);
              searchParamsObj.set("category", cat.slug);

              return (
                <Link
                  key={cat.id}
                  href={`/browse?${searchParamsObj.toString()}`}
                  className={`inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium transition-all ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {cat.name}
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
              {query ? `Results for "${query}"` : "All Courses"}
            </h2>
          </div>
          <Badge variant="outline" className="w-fit">
            {results.length} {results.length === 1 ? "Course" : "Courses"}
          </Badge>
        </div>

        {results.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {results.map(({ product, avgRating, reviewCount }) => (
              <ProductCard
                key={product.id}
                {...product}
                avgRating={avgRating ? Number(avgRating) : undefined}
                reviewCount={reviewCount}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-white/20 p-12 text-center bg-muted/20">
            <BookOpen className="mx-auto h-10 w-10 text-muted-foreground/60" />
            <h3 className="mt-4 text-lg font-semibold">
              {query
                ? `No courses found for "${query}"`
                : "No courses published yet"}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {query
                ? "Try a different keyword or browse all courses."
                : "Check back soon! Our instructors are preparing new content."}
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
