import { PageHeader } from "@/components/PageHeader";
import { db } from "@/drizzle/db";
import { CourseTable, ProductTable, CategoryTable, TagTable } from "@/drizzle/schema";
import { getCourseGlobalTag } from "@/features/courses/db/cache/courses";
import { ProductForm } from "@/features/products/components/ProductForm";
import { getProductIdTag } from "@/features/products/db/cache";
import { and, asc, eq, or } from "drizzle-orm";
import { cacheTag } from "next/dist/server/use-cache/cache-tag";
import { notFound } from "next/navigation";
import { DiscountCodeTable } from "@/features/discounts/components/DiscountCodeTable";
import { Button } from "@/components/ui/button";
import { DiscountCodeTable as DbDiscountCodeTable } from "@/drizzle/schema";
import Link from "next/link";
import { getDiscountCodeCreatorTag } from "@/features/discounts/db/cache";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;
  const product = await getProduct(productId);
  if (product == null) return notFound();

  // Fetch all options for the form
  const [courses, categories, tags] = await Promise.all([
    getCourses(),
    getCategories(),
    getTags(),
  ]);

  return (
    <div className="container my-6 flex flex-col gap-10">
      <div>
        <PageHeader title="Edit Product" />
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
      </div>
      <div>
        <PageHeader title="Discount Codes">
          <Button asChild>
            <Link href={`/teach/discounts/new?productId=${productId}`}>
              New Discount Code
            </Link>
          </Button>
        </PageHeader>
        <DiscountCodeTable
          discountCodes={(
            await getDiscountCodesForProduct(productId, product.authorId)
          ).map((dc) => ({ ...dc, productName: dc.product?.name ?? null }))}
        />
      </div>
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
