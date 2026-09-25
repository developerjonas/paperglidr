import { db } from "@/drizzle/db";
import {
  PurchaseTable as DbPurchaseTable,
  ProductTable,
} from "@/drizzle/schema";
import { PurchaseTable } from "@/features/purchases/components/PurchaseTable";
import { getPurchaseGlobalTag } from "@/features/purchases/db/cache";
import { getUserGlobalTag } from "@/features/users/db/cache";
import { getCurrentUser } from "@/services/auth";
import { desc, eq, inArray } from "drizzle-orm";
import { cacheTag } from "next/dist/server/use-cache/cache-tag";
import { redirect } from "next/navigation";

export default async function PurchasesPage() {
  const { userId } = await getCurrentUser();
  if (userId == null) redirect("/sign-in");

  const purchases = await getPurchasesForInstructor(userId);

  return (
    <div className="flex flex-col min-h-screen">
      {/* ---------------- HERO ---------------- */}
      <section className="relative overflow-hidden section-muted border-b py-14 md:py-20">
        <div className="container mx-auto px-4">
          <h1 className="heading-display text-3xl sm:text-4xl">
            Sales
          </h1>
        </div>
      </section>

      {/* ---------------- CONTENT ---------------- */}
      <section className="container mx-auto px-4 py-10">
        {purchases.length > 0 ? (
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <PurchaseTable purchases={purchases} />
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border bg-secondary/40 p-10 text-center">
            <p className="text-sm text-muted-foreground">
              No sales yet — once someone buys one of your products, it&apos;ll
              show up here.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

async function getPurchasesForInstructor(instructorUserId: string) {
  "use cache";
  cacheTag(getPurchaseGlobalTag(), getUserGlobalTag());
  // Only this instructor's own products are eligible to appear here.
  const ownProducts = await db.query.ProductTable.findMany({
    where: eq(ProductTable.authorId, instructorUserId),
    columns: { id: true },
  });
  const ownProductIds = ownProducts.map((p) => p.id);
  if (ownProductIds.length === 0) return [];
  return db.query.PurchaseTable.findMany({
    where: inArray(DbPurchaseTable.productId, ownProductIds),
    columns: {
      id: true,
      pricePaidInPaisa: true,
      refundedAt: true,
      productDetails: true,
      createdAt: true,
    },
    orderBy: desc(DbPurchaseTable.createdAt),
    with: { user: { columns: { name: true } } },
  });
}
