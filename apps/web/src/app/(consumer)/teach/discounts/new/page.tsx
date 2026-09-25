import { db } from "@/drizzle/db";
import { ProductTable } from "@/drizzle/schema";
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
      <section className="relative overflow-hidden section-muted border-b py-14 md:py-20">
        <div className="container mx-auto px-4">
          <h1 className="heading-display text-3xl sm:text-4xl">
            New Discount Code
          </h1>
        </div>
      </section>

      {/* ---------------- CONTENT ---------------- */}
      <section className="container mx-auto px-4 py-10">
        <div className="mx-auto max-w-xl">
          <Card className="border-border bg-card shadow-sm">
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

// The current user's own products (products.authorId).
async function getOwnProducts(authorId: string | undefined) {
  "use cache";
  cacheTag(getProductGlobalTag());
  if (!authorId) return [];
  return db
    .select({ id: ProductTable.id, name: ProductTable.name })
    .from(ProductTable)
    .where(eq(ProductTable.authorId, authorId))
    .orderBy(asc(ProductTable.name));
}
