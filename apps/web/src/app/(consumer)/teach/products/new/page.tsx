import { db } from "@/drizzle/db";
import { CategoryTable, CourseTable, TagTable } from "@/drizzle/schema";
import { getCourseGlobalTag } from "@/features/courses/db/cache/courses";
import { ProductForm } from "@/features/products/components/ProductForm";
import { asc } from "drizzle-orm";
import { cacheTag } from "next/dist/server/use-cache/cache-tag";
import { Card, CardContent } from "@/components/ui/card";

export default async function NewProductPage() {
  const [courses, categories, tags] = await Promise.all([
    getCourses(),
    getCategories(),
    getTags(),
  ]);

  return (
    <div className="flex flex-col min-h-screen">
      {/* ---------------- HERO ---------------- */}
      <section className="relative overflow-hidden border-b border-white/10 bg-gradient-to-b from-primary/5 via-background to-background py-14 md:py-20">
        <div className="absolute top-0 left-1/2 -z-10 h-[280px] w-[480px] -translate-x-1/2 rounded-full bg-primary/10 blur-[120px]" />
        <div className="container mx-auto px-4">
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
            New Product
          </h1>
        </div>
      </section>

      {/* ---------------- CONTENT ---------------- */}
      <section className="container mx-auto px-4 py-10">
        <Card className="border-white/30 bg-white/60 shadow-sm backdrop-blur-2xl backdrop-saturate-150 dark:border-white/10 dark:bg-black/40">
          <CardContent className="pt-6">
            <ProductForm
              courses={courses}
              categories={categories}
              tags={tags}
            />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

async function getCourses() {
  "use cache";
  cacheTag(getCourseGlobalTag());
  return db.query.CourseTable.findMany({
    orderBy: asc(CourseTable.name),
    columns: { id: true, name: true },
  });
}

async function getCategories() {
  return db.query.CategoryTable.findMany({
    orderBy: asc(CategoryTable.name),
    columns: { id: true, name: true },
  });
}

async function getTags() {
  return db.query.TagTable.findMany({
    orderBy: asc(TagTable.name),
    columns: { id: true, name: true },
  });
}
