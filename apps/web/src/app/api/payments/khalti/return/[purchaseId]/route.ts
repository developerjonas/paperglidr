import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/drizzle/db";
import { PurchaseTable } from "@/drizzle/schema";
import { verifyAndFulfil } from "@/features/purchases/lib/verifyAndFulfil";
import { purchaseIdSchema, redirectForOutcome } from "@/features/purchases/lib/returnRedirect";
import { safeErrorMessage } from "@/lib/safeError";
import { env as clientEnv } from "@/data/env/client";

// Khalti return_url: /api/payments/khalti/return/<purchaseId>?pidx=...&status=...
async function handle(
  request: NextRequest,
  { params }: { params: Promise<{ purchaseId: string }> },
) {
  const { purchaseId } = await params;
  if (!purchaseIdSchema.safeParse(purchaseId).success) {
    return new NextResponse("Not found", { status: 404 });
  }
  const purchase = await db.query.PurchaseTable.findFirst({
    where: eq(PurchaseTable.id, purchaseId),
    columns: { gateway: true, gatewayCheckoutId: true },
  });
  if (purchase?.gateway !== "khalti") {
    return new NextResponse("Not found", { status: 404 });
  }

  // Query params are hints only. verifyAndFulfil looks up the pidx WE
  // stored at initiation, never the one in the URL.
  const pidx = request.nextUrl.searchParams.get("pidx");
  if (pidx != null && pidx !== purchase.gatewayCheckoutId) {
    console.warn(`[payments] khalti return for ${purchaseId}: pidx in URL does not match stored pidx`);
  }

  return redirectForOutcome(await verifyAndFulfil(purchaseId, "return"));
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ purchaseId: string }> },
) {
  try {
    return await handle(request, context);
  } catch (error) {
    // Unexpected: log in full, send the buyer somewhere useful. The cron
    // will still settle the purchase with the gateway.
    safeErrorMessage(error, "payments: khalti return");
    return NextResponse.redirect(`${clientEnv.NEXT_PUBLIC_APP_URL}/products/purchase-failure`, 303);
  }
}
