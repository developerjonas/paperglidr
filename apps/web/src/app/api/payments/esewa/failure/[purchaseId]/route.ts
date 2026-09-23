import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/drizzle/db";
import { PurchaseTable } from "@/drizzle/schema";
import { verifyAndFulfil } from "@/features/purchases/lib/verifyAndFulfil";
import { purchaseIdSchema, redirectForOutcome } from "@/features/purchases/lib/returnRedirect";
import { safeErrorMessage } from "@/lib/safeError";
import { env as clientEnv } from "@/data/env/client";

// eSewa failure_url. The buyer cancelled or eSewa refused — but still ask
// the status API: the gateway, not the redirect, decides the outcome.
async function handle(
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

export async function GET(
  request: Request,
  context: { params: Promise<{ purchaseId: string }> },
) {
  try {
    return await handle(request, context);
  } catch (error) {
    // Unexpected: log in full, send the buyer somewhere useful. The cron
    // will still settle the purchase with the gateway.
    safeErrorMessage(error, "payments: esewa failure");
    return NextResponse.redirect(`${clientEnv.NEXT_PUBLIC_APP_URL}/products/purchase-failure`, 303);
  }
}
