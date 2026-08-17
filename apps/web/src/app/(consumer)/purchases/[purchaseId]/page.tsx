import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { db } from "@/drizzle/db";
import { PurchaseTable } from "@/drizzle/schema";
import { getPurchaseIdTag } from "@/features/purchases/db/cache";
import { formatDate } from "@/lib/formatters";
import { getCurrentUser } from "@/services/auth";
import { and, eq } from "drizzle-orm";
import { cacheTag } from "next/dist/server/use-cache/cache-tag";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

export default async function EnrollmentPage({
  params,
}: {
  params: Promise<{ purchaseId: string }>;
}) {
  const { purchaseId } = await params;

  return (
    <div className="flex flex-col min-h-screen">
      <Suspense
        fallback={
          <section className="container mx-auto px-4 py-24">
            <LoadingSpinner className="size-36 mx-auto" />
          </section>
        }
      >
        <SuspenseBoundary purchaseId={purchaseId} />
      </Suspense>
    </div>
  );
}

async function SuspenseBoundary({ purchaseId }: { purchaseId: string }) {
  const { userId, redirectToSignIn, user } = await getCurrentUser({
    allData: true,
  });
  if (userId == null || user == null) return redirectToSignIn();

  const enrollment = await getEnrollment({ userId, id: purchaseId });
  if (enrollment == null) return notFound();

  return (
    <>
      {/* ---------------- HERO ---------------- */}
      <section className="relative overflow-hidden border-b border-white/10 bg-gradient-to-b from-primary/5 via-background to-background py-14 md:py-20">
        <div className="absolute top-0 left-1/2 -z-10 h-[280px] w-[480px] -translate-x-1/2 rounded-full bg-primary/10 blur-[120px]" />

        <div className="container mx-auto px-4">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl text-balance">
              {enrollment.productDetails.name}
            </h1>
            <Button variant="outline" asChild>
              <Link href={`/courses/${enrollment.productId}`}>
                Go to Course
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ---------------- CONTENT ---------------- */}
      <section className="container mx-auto px-4 py-10">
        <div className="mx-auto max-w-2xl">
          <Card className="border-white/30 bg-white/60 shadow-sm backdrop-blur-2xl backdrop-saturate-150 dark:border-white/10 dark:bg-black/40">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <CardTitle className="text-lg">Enrollment</CardTitle>
                  <CardDescription>ID: {purchaseId}</CardDescription>
                </div>
                <Badge variant="secondary" className="rounded-[4px] text-xs">
                  Enrolled
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 border-t border-white/20 pt-4 dark:border-white/10">
              <div className="rounded-[5px] border border-white/30 bg-white/40 p-3 dark:border-white/10 dark:bg-white/[0.03]">
                <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                  Date
                </p>
                <p className="mt-0.5 text-sm font-medium">
                  {formatDate(enrollment.createdAt)}
                </p>
              </div>
              <div className="rounded-[5px] border border-white/30 bg-white/40 p-3 dark:border-white/10 dark:bg-white/[0.03]">
                <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                  Course
                </p>
                <p className="mt-0.5 text-sm font-medium">
                  {enrollment.productDetails.name}
                </p>
              </div>
              <div className="rounded-[5px] border border-white/30 bg-white/40 p-3 dark:border-white/10 dark:bg-white/[0.03]">
                <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                  Student
                </p>
                <p className="mt-0.5 text-sm font-medium">{user.name}</p>
              </div>
              <div className="rounded-[5px] border border-white/30 bg-white/40 p-3 dark:border-white/10 dark:bg-white/[0.03]">
                <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                  Price
                </p>
                <p className="mt-0.5 text-sm font-medium">Free</p>
              </div>
            </CardContent>
            <CardFooter className="border-t border-white/20 pt-4 dark:border-white/10">
              <p className="text-sm text-muted-foreground">
                This course is free — no payment was required to access it.
              </p>
            </CardFooter>
          </Card>
        </div>
      </section>
    </>
  );
}

async function getEnrollment({ userId, id }: { userId: string; id: string }) {
  "use cache";
  cacheTag(getPurchaseIdTag(id));
  return db.query.PurchaseTable.findFirst({
    columns: {
      productId: true,
      productDetails: true,
      createdAt: true,
    },
    where: and(eq(PurchaseTable.id, id), eq(PurchaseTable.userId, userId)),
  });
}
