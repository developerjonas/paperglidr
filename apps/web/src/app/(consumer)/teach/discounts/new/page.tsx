import { db } from "@/drizzle/db";
import {
  CourseProductTable,
  CourseTable,
  ProductTable,
} from "@/drizzle/schema";
import { DiscountCodeForm } from "@/features/discounts/components/DiscountCodeForm";
import { getProductGlobalTag } from "@/features/products/db/cache";
import { auth } from "@/lib/auth";
import { asc, eq } from "drizzle-orm";
import { cacheTag } from "next/dist/server/use-cache/cache-tag";
import { headers } from "next/headers";
import { Card, CardContent } from "@/components/ui/card";

export default async function NewDiscountCodePage({
  searchParams,
}: {
  searchParams: Promise<{ productId?: string }>;
}) {
  const { productId } = await searchParams;
  const session = await auth.api.getSession({ headers: await headers() });

  return (
    <div className="flex flex-col min-h-screen">
      {/* ---------------- HERO ---------------- */}
      <section className="relative overflow-hidden border-b border-white/10 bg-gradient-to-b from-primary/5 via-background to-background py-14 md:py-20">
        <div className="absolute top-0 left-1/2 -z-10 h-[280px] w-[480px] -translate-x-1/2 rounded-full bg-primary/10 blur-[120px]" />
        <div className="container mx-auto px-4">
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
            New Discount Code
          </h1>
        </div>
      </section>

      {/* ---------------- CONTENT ---------------- */}
      <section className="container mx-auto px-4 py-10">
        <div className="mx-auto max-w-xl">
          <Card className="border-white/30 bg-white/60 shadow-sm backdrop-blur-2xl backdrop-saturate-150 dark:border-white/10 dark:bg-black/40">
            <CardContent className="pt-6">
              <DiscountCodeForm
                products={await getOwnProducts(session?.user?.id)}
                presetProductId={productId}
              />
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}

// Scoped to products where the current user authored at least one linked
// course. Same "first-author-wins" caveat as the edit page for bundles
// spanning multiple authors.
async function getOwnProducts(authorId: string | undefined) {
  "use cache";
  cacheTag(getProductGlobalTag());
  if (!authorId) return [];
  return db
    .selectDistinct({ id: ProductTable.id, name: ProductTable.name })
    .from(ProductTable)
    .innerJoin(
      CourseProductTable,
      eq(CourseProductTable.productId, ProductTable.id),
    )
    .innerJoin(CourseTable, eq(CourseTable.id, CourseProductTable.courseId))
    .where(eq(CourseTable.authorId, authorId))
    .orderBy(asc(ProductTable.name));
}
