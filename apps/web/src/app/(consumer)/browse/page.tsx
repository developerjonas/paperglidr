import Link from "next/link";
import { ArrowLeft, ArrowRight, BookOpen } from "lucide-react";
import { Suspense } from "react";
import type { Metadata } from "next";
import { ProductCard } from "@/features/products/components/ProductCard";
import { searchProducts } from "@/features/search/db/search";
import { SearchBar } from "@/features/search/components/SearchBar";
import { getPublicCategories, getPublicCategoryCounts } from "@/features/categories/db/categories";
import { categoryStyle } from "@/features/categories/lib/categoryStyle";
import { pageMetadata } from "@/lib/site";
import { cn } from "@/lib/utils";
import { OfficialSourceNote } from "@/components/OfficialSourceNote";

export const metadata: Metadata = pageMetadata({
  title: "Browse courses",
  description:
    "Browse every course on Chiyali — Loksewa, entrance prep, languages, programming, accounting and more, from Nepali instructors, priced in NPR.",
  path: "/browse",
});

const courses = (n: number) => `${n} ${n === 1 ? "course" : "courses"}`;

export default async function BrowsePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  const { q, category } = await searchParams;
  const query = q?.trim() ?? "";

  const [categories, counts] = await Promise.all([getPublicCategories(), getPublicCategoryCounts()]);
  const current = categories.find((c) => c.slug === category);

  const results = await searchProducts({
    q: query || undefined,
    categoryId: current?.id,
    sort: "relevance",
    page: 1,
  });

  // Topic cards when just browsing; a topic header and pills once a topic or search is chosen.
  const showTopics = !query && !current;
  const hrefFor = (slug?: string) => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (slug) params.set("category", slug);
    const s = params.toString();
    return s ? `/browse?${s}` : "/browse";
  };
  const style = current ? categoryStyle(current.slug) : null;

  return (
    <div className="flex min-h-screen flex-col">
      <section className="section-muted border-b">
        <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 md:py-14 lg:px-8">
          {current && style ? (
            <div className="flex flex-col gap-4">
              <Link href={hrefFor()} className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-4 w-4" /> All topics
              </Link>
              <div className="flex items-center gap-4">
                <span className={cn("flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl", style.tile)}>
                  <style.icon className="h-7 w-7" />
                </span>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{current.name}</h1>
                  <p className="mt-1 text-sm text-muted-foreground sm:text-base">
                    {courses(counts[current.id] ?? 0)} from Nepali teachers
                  </p>
                </div>
              </div>
              <OfficialSourceNote topicSlug={current.slug} />
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Browse courses</h1>
              <p className="mt-1 text-sm text-muted-foreground sm:text-base">
                Pick a topic, or search by title or teacher.
              </p>
            </>
          )}
          <div className="mt-6 md:hidden">
            <Suspense fallback={<div className="h-10 w-full animate-pulse rounded-lg bg-muted" />}>
              <SearchBar autoFocus={!showTopics} />
            </Suspense>
          </div>
        </div>
      </section>

      {showTopics && categories.length > 0 && (
        <section className="mx-auto w-full max-w-7xl px-4 pt-10 sm:px-6 lg:px-8">
          <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">Explore by topic</h2>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {categories.map((cat) => {
              const s = categoryStyle(cat.slug);
              const n = counts[cat.id] ?? 0;
              return (
                <Link
                  key={cat.id}
                  href={hrefFor(cat.slug)}
                  className={cn(
                    "group flex flex-col gap-4 rounded-2xl border bg-card p-4 transition-all hover:-translate-y-0.5 hover:shadow-md sm:p-5",
                    s.hover,
                  )}
                >
                  <span className={cn("flex h-12 w-12 items-center justify-center rounded-xl", s.tile)}>
                    <s.icon className="h-6 w-6" />
                  </span>
                  <span>
                    <span className="block font-semibold leading-snug">{cat.name}</span>
                    <span className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                      {n > 0 ? courses(n) : "Coming soon"}
                      <ArrowRight className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
                    </span>
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {!showTopics && (
        <nav aria-label="Topics" className="sticky top-16 z-20 border-b bg-background/85 backdrop-blur">
          <div className="no-scrollbar mx-auto flex w-full max-w-7xl gap-2 overflow-x-auto px-4 py-3 sm:px-6 lg:px-8">
            {[{ id: "all", slug: undefined as string | undefined, name: "All topics" }, ...categories].map((cat) => {
              const active = cat.slug ? cat.slug === current?.slug : !current;
              return (
                <Link
                  key={cat.id}
                  href={hrefFor(cat.slug)}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "inline-flex shrink-0 items-center rounded-full px-4 py-1.5 text-xs font-medium transition-colors",
                    active ? "bg-primary text-primary-foreground" : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  {cat.name}
                </Link>
              );
            })}
          </div>
        </nav>
      )}

      <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-end justify-between gap-4">
          <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
            {query ? `Results for “${query}”` : current ? `All ${current.name} courses` : "All courses"}
          </h2>
          <span className="shrink-0 text-sm text-muted-foreground">{courses(results.length)}</span>
        </div>

        {results.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
          <div className="rounded-2xl border border-dashed bg-muted/20 p-12 text-center">
            <BookOpen className="mx-auto h-10 w-10 text-muted-foreground/60" />
            <h3 className="mt-4 text-lg font-semibold">
              {query ? `No courses found for “${query}”` : current ? `No ${current.name} courses yet` : "No courses published yet"}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {query || current
                ? "Try a different keyword, or look through the other topics."
                : "Check back soon: teachers are preparing new courses."}
            </p>
            {(query || current) && (
              <Link href="/browse" className="mt-4 inline-block text-sm font-medium text-primary hover:underline">
                Browse all topics
              </Link>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
