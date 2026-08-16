import { LoadingSpinner } from "@/components/LoadingSpinner";
import { PageHeader } from "@/components/PageHeader";
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
    <div className="container my-6">
      <Suspense fallback={<LoadingSpinner className="size-36 mx-auto" />}>
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
      <PageHeader title={enrollment.productDetails.name}>
        <Button variant="outline" asChild>
          <Link href={`/courses/${enrollment.productId}`}>Go to Course</Link>
        </Button>
      </PageHeader>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex justify-between items-start gap-4">
            <div className="flex flex-col gap-1">
              <CardTitle>Enrollment</CardTitle>
              <CardDescription>ID: {purchaseId}</CardDescription>
            </div>
            <Badge className="text-base">Enrolled</Badge>
          </div>
        </CardHeader>
        <CardContent className="pb-4 grid grid-cols-2 gap-8 border-t pt-4">
          <div>
            <label className="text-sm text-muted-foreground">Date</label>
            <div>{formatDate(enrollment.createdAt)}</div>
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Course</label>
            <div>{enrollment.productDetails.name}</div>
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Student</label>
            <div>{user.name}</div>
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Price</label>
            <div>Free</div>
          </div>
        </CardContent>
        <CardFooter className="border-t pt-4">
          <p className="text-sm text-muted-foreground">
            This course is free — no payment was required to access it.
          </p>
        </CardFooter>
      </Card>
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
