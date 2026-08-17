import { Button } from "@/components/ui/button";
import Link from "next/link";
import { cacheTag } from "next/dist/server/use-cache/cache-tag";
import { db } from "@/drizzle/db";
import {
  CourseProductTable,
  ProductTable as DbProductTable,
  PurchaseTable,
} from "@/drizzle/schema";
import { asc, countDistinct, eq } from "drizzle-orm";
import { getProductGlobalTag } from "@/features/products/db/cache";
import { ProductTable } from "@/features/products/components/ProductTable";

export default async function ProductsPage() {
  const products = await getProducts();

  return (
    <div className="flex flex-col min-h-screen">
      {/* ---------------- HERO ---------------- */}
      <section className="relative overflow-hidden border-b border-white/10 bg-gradient-to-b from-primary/5 via-background to-background py-14 md:py-20">
        <div className="absolute top-0 left-1/2 -z-10 h-[280px] w-[480px] -translate-x-1/2 rounded-full bg-primary/10 blur-[120px]" />
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
              Products
            </h1>
            <Button asChild>
              <Link href="/teach/products/new">New Product</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ---------------- CONTENT ---------------- */}
      <section className="container mx-auto px-4 py-10">
        <div className="overflow-hidden rounded-2xl border border-white/30 bg-white/60 shadow-sm backdrop-blur-2xl backdrop-saturate-150 dark:border-white/10 dark:bg-black/40">
          <ProductTable products={products} />
        </div>
      </section>
    </div>
  );
}

async function getProducts() {
  "use cache";
  cacheTag(getProductGlobalTag());
  return db
    .select({
      id: DbProductTable.id,
      name: DbProductTable.name,
      status: DbProductTable.status,
      priceInRupees: DbProductTable.priceInRupees,
      description: DbProductTable.description,
      imageUrl: DbProductTable.imageUrl,
      coursesCount: countDistinct(CourseProductTable.courseId),
      customersCount: countDistinct(PurchaseTable.userId),
    })
    .from(DbProductTable)
    .leftJoin(PurchaseTable, eq(PurchaseTable.productId, DbProductTable.id))
    .leftJoin(
      CourseProductTable,
      eq(CourseProductTable.productId, DbProductTable.id),
    )
    .orderBy(asc(DbProductTable.name))
    .groupBy(DbProductTable.id);
}
