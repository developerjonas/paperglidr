import { BookOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ProductCard } from "@/features/products/components/ProductCard";
import {
  getPublicProducts,
  searchPublicProducts,
} from "@/features/products/db/products";
import { SearchBar } from "@/features/products/components/SearchBar";
import { Suspense } from "react";

const HARDCODED_CATEGORIES = [
  { id: "all", name: "All Courses" },
  { id: "tech", name: "Web & Software" },
  { id: "loksewa", name: "Lok Sewa & Govt." },
  { id: "academics", name: "SEE & Class 11/12" },
  { id: "design", name: "UI/UX & Design" },
  { id: "business", name: "Business & Marketing" },
];

export default async function BrowsePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";

  const products = query
    ? await searchPublicProducts(query)
    : await getPublicProducts();

  return (
    <div className="flex flex-col min-h-screen">
      {/* ---------------- PAGE HEADER + SEARCH ---------------- */}
      <section className="border-b border-white/10 bg-gradient-to-b from-primary/5 via-background to-background py-10 md:py-14">
        <div className="container mx-auto px-4">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Browse Courses
          </h1>
          <p className="mt-1 text-sm text-muted-foreground sm:text-base">
            Find the right course by title, topic, or category.
          </p>

          <div className="mt-6 max-w-xl">
            <Suspense
              fallback={
                <div className="h-11 w-full rounded-full bg-white/40 backdrop-blur-md dark:bg-white/5" />
              }
            >
              <SearchBar redirectTo="/browse" />
            </Suspense>
          </div>
        </div>
      </section>

      {/* ---------------- CATEGORY BAR (decorative until step 2) ---------------- */}
      <section className="sticky top-16 z-20 border-b border-white/10 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
            {HARDCODED_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                className="inline-flex shrink-0 items-center gap-2 rounded-full bg-muted/50 px-4 py-1.5 text-xs font-medium text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- RESULTS ---------------- */}
      <section className="container mx-auto px-4 py-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
              {query ? `Results for "${query}"` : "All Courses"}
            </h2>
          </div>
          <Badge variant="outline" className="w-fit">
            {products.length} {products.length === 1 ? "Course" : "Courses"}
          </Badge>
        </div>

        {products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} {...product} />
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
