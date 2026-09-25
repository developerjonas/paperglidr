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
import { POLICY_TERMS } from "@/config/policyTerms";
import type { PurchaseStatus } from "@/drizzle/schema";
import { RefundRequestButton } from "@/features/refunds/components/RefundRequestButton";
import { getLatestRefundRequest } from "@/features/refunds/db/refunds";
import { getRefundEligibility } from "@/features/refunds/lib/eligibility";
import { formatDate } from "@/lib/formatters";
import { getCurrentUser } from "@/services/auth";
import { and, eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { z } from "zod";

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

  if (!z.string().uuid().safeParse(purchaseId).success) return notFound();
  const enrollment = await getEnrollment({ userId, id: purchaseId });
  if (enrollment == null) return notFound();

  return (
    <>
      {/* ---------------- HERO ---------------- */}
      <section className="relative overflow-hidden section-muted border-b py-14 md:py-20">

        <div className="container mx-auto px-4">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <h1 className="heading-display text-3xl sm:text-4xl text-balance">
              {enrollment.productDetails.name}
            </h1>
            <Button variant="outline" asChild>
              <Link href="/courses">Go to my courses</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ---------------- CONTENT ---------------- */}
      <section className="container mx-auto px-4 py-10">
        <div className="mx-auto max-w-2xl">
          <Card className="border-border bg-card shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <CardTitle className="text-lg">Enrollment</CardTitle>
                  <CardDescription>ID: {purchaseId}</CardDescription>
                </div>
                <Badge variant="secondary" className="rounded-md text-xs">
                  {STATUS_LABELS[enrollment.status]}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 border-t border-border pt-4">
              <div className="rounded-lg border border-border bg-secondary/60 p-3">
                <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                  Date
                </p>
                <p className="mt-0.5 text-sm font-medium">
                  {formatDate(enrollment.createdAt)}
                </p>
              </div>
              <div className="rounded-lg border border-border bg-secondary/60 p-3">
                <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                  Course
                </p>
                <p className="mt-0.5 text-sm font-medium">
                  {enrollment.productDetails.name}
                </p>
              </div>
              <div className="rounded-lg border border-border bg-secondary/60 p-3">
                <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                  Student
                </p>
                <p className="mt-0.5 text-sm font-medium">{user.name}</p>
              </div>
              <div className="rounded-lg border border-border bg-secondary/60 p-3">
                <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                  Price
                </p>
                <p className="mt-0.5 text-sm font-medium">
                  {enrollment.pricePaidInPaisa === 0
                    ? "Free"
                    : `NPR ${(enrollment.pricePaidInPaisa / 100).toLocaleString("en-IN")}`}
                </p>
              </div>
            </CardContent>
            <CardFooter className="border-t border-border pt-4">
              <RefundSection purchase={enrollment} />
            </CardFooter>
          </Card>
        </div>
      </section>
    </>
  );
}

const STATUS_LABELS: Record<PurchaseStatus, string> = {
  completed: "Enrolled",
  pending: "Payment pending",
  failed: "Payment failed",
  disputed: "Under review",
  refunded: "Refunded",
}

async function RefundSection({
  purchase,
}: {
  purchase: NonNullable<Awaited<ReturnType<typeof getEnrollment>>>
}) {
  if (purchase.pricePaidInPaisa === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        This course is free — no payment was required to access it.
      </p>
    )
  }
  if (purchase.status === "refunded") {
    return (
      <p className="text-sm text-muted-foreground">
        This purchase was refunded and its access has ended.
      </p>
    )
  }

  const latestRequest = await getLatestRefundRequest(purchase.id)
  if (latestRequest?.status === "pending") {
    return (
      <p className="text-sm text-muted-foreground">
        Refund requested on {formatDate(latestRequest.createdAt)}. We&apos;ll
        email you when it has been reviewed.
      </p>
    )
  }

  const eligibility = await getRefundEligibility(purchase.id)
  if (eligibility.eligible) {
    return (
      <div className="flex w-full flex-col gap-2">
        {latestRequest?.status === "denied" && (
          <p className="text-sm text-muted-foreground">
            An earlier refund request was not approved. You can ask again
            while the purchase still qualifies.
          </p>
        )}
        <RefundRequestButton
          purchaseId={purchase.id}
          msRemaining={eligibility.msRemaining}
          completionPercent={eligibility.completionPercent}
        />
      </div>
    )
  }

  return (
    <p className="text-sm text-muted-foreground">
      {eligibility.reason === "window_closed"
        ? `The ${POLICY_TERMS.refundWindowDays}-day refund window for this purchase has closed.`
        : eligibility.reason === "completion_too_high"
          ? `You've completed ${POLICY_TERMS.refundCompletionThresholdPercent}% or more of this course, so it no longer qualifies for a refund.`
          : "This purchase isn't eligible for a refund."}{" "}
      See our <Link href="/refund-policy" className="underline">refund policy</Link>.
    </p>
  )
}

// Uncached: status and refund state must be current on this page.
async function getEnrollment({ userId, id }: { userId: string; id: string }) {
  return db.query.PurchaseTable.findFirst({
    columns: {
      id: true,
      productId: true,
      productDetails: true,
      createdAt: true,
      pricePaidInPaisa: true,
      status: true,
    },
    where: and(eq(PurchaseTable.id, id), eq(PurchaseTable.userId, userId)),
  });
}
