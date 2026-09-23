import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/drizzle/db";
import { PurchaseTable } from "@/drizzle/schema";
import { verifyAndFulfil } from "@/features/purchases/lib/verifyAndFulfil";
import { purchaseIdSchema, redirectForOutcome } from "@/features/purchases/lib/returnRedirect";

// eSewa failure_url. The buyer cancelled or eSewa refused — but still ask
// the status API: the gateway, not the redirect, decides the outcome.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ purchaseId: string }> },
) {
  const { purchaseId } = await params;
  if (!purchaseIdSchema.safeParse(purchaseId).success) {
    return new NextResponse("Not found", { status: 404 });
  }
  const purchase = await db.query.PurchaseTable.findFirst({
    where: eq(PurchaseTable.id, purchaseId),
    columns: { gateway: true },
  });
  if (purchase?.gateway !== "esewa") {
    return new NextResponse("Not found", { status: 404 });
  }

  const result = await verifyAndFulfil(purchaseId, "return");
  // Arriving via the failure URL with nothing completed: show the failure
  // page even though the purchase may still be pending (the cron settles it).
  return redirectForOutcome(
    result.outcome === "pending" || result.outcome === "error"
      ? { ...result, outcome: "skipped" }
      : result,
  );
}
