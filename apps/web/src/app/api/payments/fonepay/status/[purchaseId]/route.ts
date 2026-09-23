import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/drizzle/db";
import { PurchaseTable } from "@/drizzle/schema";
import { getCurrentUser } from "@/services/auth";
import { verifyAndFulfil } from "@/features/purchases/lib/verifyAndFulfil";
import { purchaseIdSchema } from "@/features/purchases/lib/returnRedirect";

// Polled by the Fonepay QR checkout (owner only). Returns the purchase
// status after asking Fonepay.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ purchaseId: string }> },
) {
  const { purchaseId } = await params;
  const notFound = NextResponse.json({ status: "not_found" }, { status: 404 });
  if (!purchaseIdSchema.safeParse(purchaseId).success) return notFound;

  const { userId } = await getCurrentUser();
  const purchase = await db.query.PurchaseTable.findFirst({
    where: eq(PurchaseTable.id, purchaseId),
    columns: { gateway: true, userId: true },
  });
  if (purchase == null || userId == null || purchase.userId !== userId || purchase.gateway !== "fonepay") {
    return notFound;
  }

  const { outcome } = await verifyAndFulfil(purchaseId, "poll");
  const status =
    outcome === "completed" || outcome === "already_completed"
      ? "completed"
      : outcome === "pending" || outcome === "error"
        ? "pending"
        : "failed";
  return NextResponse.json({ status });
}
