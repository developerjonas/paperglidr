import { Button } from "@/components/ui/button";
import { db } from "@/drizzle/db";
import {
  CourseTable,
  ProductTable,
  CategoryTable,
  TagTable,
} from "@/drizzle/schema";
import { getCourseGlobalTag } from "@/features/courses/db/cache/courses";
import { ProductForm } from "@/features/products/components/ProductForm";
import { getProductIdTag } from "@/features/products/db/cache";
import { and, asc, eq, or } from "drizzle-orm";
import { cacheTag } from "next/dist/server/use-cache/cache-tag";
import { notFound } from "next/navigation";
import { DiscountCodeTable } from "@/features/discounts/components/DiscountCodeTable";
import { DiscountCodeTable as DbDiscountCodeTable } from "@/drizzle/schema";
import Link from "next/link";
import { getDiscountCodeCreatorTag } from "@/features/discounts/db/cache";
import { Card, CardContent } from "@/components/ui/card";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;
  const product = await getProduct(productId);
  if (product == null) return notFound();

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
            Edit Product
          </h1>
        </div>
      </section>

      {/* ---------------- CONTENT ---------------- */}
      <section className="container mx-auto px-4 py-10">
        <div className="flex flex-col gap-10">
          <Card className="border-white/30 bg-white/60 shadow-sm backdrop-blur-2xl backdrop-saturate-150 dark:border-white/10 dark:bg-black/40">
            <CardContent className="pt-6">
              <ProductForm
                product={{
                  ...product,
                  categoryId: product.categoryId ?? null,
                  courseIds: product.courseProducts.map((c) => c.courseId),
                  tagIds: product.productTags?.map((t) => t.tagId) ?? [],
                }}
                courses={courses}
                categories={categories}
                tags={tags}
              />
            </CardContent>
          </Card>

          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-lg font-semibold px-1">Discount Codes</h2>
              <Button asChild>
                <Link href={`/teach/discounts/new?productId=${productId}`}>
                  New Discount Code
                </Link>
              </Button>
            </div>
            <div className="overflow-hidden rounded-2xl border border-white/30 bg-white/60 shadow-sm backdrop-blur-2xl backdrop-saturate-150 dark:border-white/10 dark:bg-black/40">
              <DiscountCodeTable
                discountCodes={(
                  await getDiscountCodesForProduct(productId, product.authorId)
                ).map((dc) => ({
                  ...dc,
                  productName: dc.product?.name ?? null,
                }))}
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

async function getDiscountCodesForProduct(productId: string, authorId: string) {
  "use cache";
  cacheTag(getDiscountCodeCreatorTag(authorId));
  return db.query.DiscountCodeTable.findMany({
    where: or(
      eq(DbDiscountCodeTable.productId, productId),
      and(
        eq(DbDiscountCodeTable.scopeType, "storewide"),
        eq(DbDiscountCodeTable.creatorId, authorId),
      ),
    ),
    with: { product: { columns: { name: true } } },
    orderBy: (table, { desc }) => desc(table.createdAt),
  });
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

async function getProduct(id: string) {
  "use cache";
  cacheTag(getProductIdTag(id));
  return db.query.ProductTable.findFirst({
    columns: {
      id: true,
      name: true,
      description: true,
      priceInRupees: true,
      status: true,
      imageUrl: true,
      authorId: true,
      categoryId: true,
    },
    where: eq(ProductTable.id, id),
    with: {
      courseProducts: { columns: { courseId: true } },
      productTags: { columns: { tagId: true } },
    },
  });
}
