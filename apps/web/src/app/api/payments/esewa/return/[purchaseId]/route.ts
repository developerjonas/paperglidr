import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/drizzle/db";
import { PurchaseTable } from "@/drizzle/schema";
import { getPaymentConfig } from "@/services/payments/config";
import { decodeEsewaResponse } from "@/services/payments/esewa/esewaServer";
import { verifyAndFulfil } from "@/features/purchases/lib/verifyAndFulfil";
import { purchaseIdSchema, redirectForOutcome } from "@/features/purchases/lib/returnRedirect";

// eSewa success_url: /api/payments/esewa/return/<purchaseId>?data=<base64>
export async function GET(
  request: NextRequest,
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

  // The signed ?data= payload is a hint only — log if it doesn't check
  // out. The status API (inside verifyAndFulfil) decides.
  const data = request.nextUrl.searchParams.get("data");
  const esewa = getPaymentConfig().esewa;
  if (data != null && esewa != null) {
    const check = decodeEsewaResponse(esewa, data);
    if (!check.valid || check.transactionUuid !== purchaseId) {
      console.warn(
        `[payments] esewa return for ${purchaseId}: untrusted data payload (${check.valid ? "transaction mismatch" : check.reason})`,
      );
    }
  }

  return redirectForOutcome(await verifyAndFulfil(purchaseId, "return"));
}
