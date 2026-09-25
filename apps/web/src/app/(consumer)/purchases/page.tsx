import { Button } from "@/components/ui/button";
import { db } from "@/drizzle/db";
import { PurchaseTable } from "@/drizzle/schema";
import {
  UserPurchaseTable,
  UserPurchaseTableSkeleton,
} from "@/features/purchases/components/UserPurchaseTable";
import { getPurchaseUserTag } from "@/features/purchases/db/cache";
import { getCurrentUser } from "@/services/auth";
import { desc, eq } from "drizzle-orm";
import { cacheTag } from "next/dist/server/use-cache/cache-tag";
import Link from "next/link";
import { Suspense } from "react";

export default function PurchasesPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* ---------------- HERO ---------------- */}
      <section className="relative overflow-hidden section-muted border-b py-14 md:py-20">

        <div className="container mx-auto px-4">
          <h1 className="heading-display text-3xl sm:text-4xl">
            Purchase History
          </h1>
        </div>
      </section>

      {/* ---------------- CONTENT ---------------- */}
      <section className="container mx-auto px-4 py-10">
        <div className="mx-auto max-w-3xl">
          <Suspense fallback={<UserPurchaseTableSkeleton />}>
            <SuspenseBoundary />
          </Suspense>
        </div>
      </section>
    </div>
  );
}

async function SuspenseBoundary() {
  const { userId, redirectToSignIn } = await getCurrentUser();
  if (userId == null) return redirectToSignIn();

  const purchases = await getPurchases(userId);

  if (purchases.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border bg-secondary/40 p-10 text-center">
        <p className="text-sm text-muted-foreground">
          You have made no purchases yet.
        </p>
        <Button asChild size="lg">
          <Link href="/">Browse Courses</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <UserPurchaseTable purchases={purchases} />
    </div>
  );
}

async function getPurchases(userId: string) {
  "use cache";
  cacheTag(getPurchaseUserTag(userId));
  return db.query.PurchaseTable.findMany({
    columns: {
      id: true,
      pricePaidInPaisa: true,
      refundedAt: true,
      status: true,
      productDetails: true,
      createdAt: true,
    },
    where: eq(PurchaseTable.userId, userId),
    orderBy: desc(PurchaseTable.createdAt),
  });
}
