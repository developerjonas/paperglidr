import { PageHeader } from "@/components/PageHeader";
import { db } from "@/drizzle/db";
import { CourseTable, ProductTable } from "@/drizzle/schema";
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

  return (
    <div className="container my-6 flex flex-col gap-10">
      <div>
        <PageHeader title="Edit Product" />
        <ProductForm
          product={{
            ...product,
            courseIds: product.courseProducts.map((c) => c.courseId),
          }}
          courses={await getCourses()}
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
    // A product's page shows codes scoped directly to it, PLUS any
    // storewide code this creator has running — both are redeemable
    // against this product at checkout.
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
    },
    where: eq(ProductTable.id, id),
    with: { courseProducts: { columns: { courseId: true } } },
  });
}
