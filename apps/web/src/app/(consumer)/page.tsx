import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Presentation, ArrowRight, Sparkles } from "lucide-react";
import { ProductCard } from "@/features/products/components/ProductCard";
import { getPublicProducts } from "@/features/products/db/products";

const CATEGORIES = [
  { id: "tech", name: "Web & Software" },
  { id: "loksewa", name: "Lok Sewa & Govt." },
  { id: "academics", name: "SEE & Class 11/12" },
  { id: "design", name: "UI/UX & Design" },
  { id: "business", name: "Business & Marketing" },
];

export default async function HomePage() {
  const products = await getPublicProducts();

  return (
    <div className="flex flex-col min-h-screen">
      {/* ---------------- SLIM DISCOVERY HERO ---------------- */}
      <section className="relative overflow-hidden border-b border-white/10 bg-gradient-to-b from-primary/5 via-background to-background py-10 md:py-14">
        <div className="absolute top-0 left-1/2 -z-10 h-[220px] w-[420px] -translate-x-1/2 rounded-full bg-primary/10 blur-[100px]" />

        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center gap-2 text-center">
            <Badge
              variant="secondary"
              className="inline-flex items-center gap-1.5 border border-primary/20 bg-primary/10 px-3 py-1 text-xs text-primary backdrop-blur-md"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Nepal&apos;s Learning Platform
            </Badge>
            <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
              What do you want to learn today?
            </h1>
          </div>

          {/* Category chips */}
          <div className="mt-6 flex items-center justify-center gap-2 overflow-x-auto no-scrollbar py-1">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.id}
                href={`/browse?category=${cat.id}`}
                className="inline-flex shrink-0 items-center gap-2 rounded-[5px] bg-muted/50 px-4 py-1.5 text-xs font-medium text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
              >
                {cat.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- CATALOG ---------------- */}
      <section className="container mx-auto px-4 py-10">
        <div className="flex items-end justify-between mb-6">
          <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
            Featured Courses
          </h2>
          <Link
            href="/browse"
            className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.slice(0, 8).map((product) => (
              <ProductCard key={product.id} {...product} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-white/20 p-12 text-center bg-muted/20">
            <BookOpen className="mx-auto h-10 w-10 text-muted-foreground/60" />
            <h3 className="mt-4 text-lg font-semibold">
              No courses published yet
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Check back soon — instructors are preparing new content.
            </p>
          </div>
        )}
      </section>

      {/* ---------------- SLIM INSTRUCTOR STRIP (not a full pitch — that's landing's job) ---------------- */}
      <section className="border-t border-white/10 bg-muted/20 py-10">
        <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 text-center sm:flex-row sm:text-left">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Presentation className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold">Have something to teach?</p>
              <p className="text-sm text-muted-foreground">
                Publish a course and start earning in NPR.
              </p>
            </div>
          </div>
          <Button asChild className="rounded-[5px] shrink-0">
            <Link href="/instructors/onboarding">Become a Tutor</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
