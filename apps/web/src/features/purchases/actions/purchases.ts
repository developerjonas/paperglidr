"use server";
import { db } from "@/drizzle/db";
import { ProductTable, PurchaseTable } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import {
  insertPurchase,
  getPurchaseByIdempotencyKey,
  updatePurchase,
} from "../db/purchases";
import { getReferringInstructorId } from "../db/referral";
import { verifyAndFulfil } from "../lib/verifyAndFulfil";
import { getGateway } from "@/services/payments/gateways";
import { isGatewayEnabled, type GatewayName } from "@/services/payments/config";
import { getReturnUrls } from "@/services/payments/returnUrls";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revokeUserCourseAccess } from "@/features/courses/db/userCourseAccess";
import { reverseLedgerEntriesForPurchase } from "@/features/ledger/db/ledger";
import { revalidateProductCache } from "@/features/products/db/cache";
import { validateDiscountCode } from "@/features/discounts/lib/validateDiscountCode";
import { getCurrentUser, requireAdmin } from "@/services/auth";

export async function initiatePurchase({
  productId,
  gateway,
  idempotencyKey,
  discountCode,
}: {
  productId: string;
  gateway: GatewayName | "free";
  idempotencyKey: string;
  // Raw code string, typed by the user or carried over from
  // PromoCodeInput's preview. Re-validated from scratch here — the
  // preview in applyDiscountCode is UI-only and never trusted for the
  // actual charge amount.
  discountCode?: string;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session?.user == null) return { error: true, message: "Not signed in" };

  const existing = await getPurchaseByIdempotencyKey(idempotencyKey);
  if (existing != null) {
    return {
      error: false,
      purchaseId: existing.id,
      redirectUrl:
        existing.rawGatewayResponse != null
          ? ((existing.rawGatewayResponse as { redirectUrl?: string })
              .redirectUrl ?? null)
          : null,
    };
  }

  const product = await db.query.ProductTable.findFirst({
    where: eq(ProductTable.id, productId),
  });
  if (product == null) return { error: true, message: "Product not found" };

  let discountCodeId: string | null = null;
  let discountAmountPaisa = 0;

  if (discountCode) {
    const validation = await validateDiscountCode({
      code: discountCode,
      userId: session.user.id,
      productId,
      priceInRupees: product.priceInRupees,
    });
    // A stale code (expired/exhausted between preview and checkout) is
    // ignored rather than failing the whole purchase — full price is
    // charged instead. ADJUST if you'd rather hard-fail the purchase here.
    if (validation.valid) {
      discountCodeId = validation.discountCodeId;
      discountAmountPaisa = Math.round(validation.amountOffInRupees * 100);
    }
  }

  const pricePaidInPaisa = Math.max(
    0,
    Math.round(product.priceInRupees * 100) - discountAmountPaisa,
  );
  const referredByInstructorId = await getReferringInstructorId();

  const productDetails = {
    name: product.name,
    description: product.description,
    imageUrl: product.imageUrl,
  };

  // Free products, AND products fully discounted to zero, skip the gateway.
  if (gateway === "free" || pricePaidInPaisa === 0) {
    const purchase = await insertPurchase({
      userId: session.user.id,
      productId,
      productDetails,
      pricePaidInPaisa: 0,
      gateway: "free",
      status: "pending",
      gatewayCheckoutId: idempotencyKey,
      idempotencyKey,
      referredByInstructorId,
      discountCodeId,
      discountAmountPaisa,
    });
    if (purchase == null)
      return { error: true, message: "Could not start free purchase" };

    return {
      error: false,
      purchaseId: purchase.id,
      redirectUrl: null,
      isFree: true,
    };
  }

  // Server-side: only gateways enabled in this deployment's payment config.
  // The client's list is a convenience, never the check.
  const wiredGateway = isGatewayEnabled(gateway) ? getGateway(gateway) : null;
  if (wiredGateway == null)
    return { error: true, message: "Unsupported payment method" };

  const purchase = await insertPurchase({
    userId: session.user.id,
    productId,
    productDetails,
    pricePaidInPaisa,
    gateway,
    status: "pending",
    gatewayCheckoutId: idempotencyKey,
    idempotencyKey,
    referredByInstructorId,
    discountCodeId,
    discountAmountPaisa,
  });
  if (purchase == null)
    return { error: true, message: "Could not start purchase" };

  const initiation = await wiredGateway.initiate({
    purchaseId: purchase.id,
    amountInPaisa: purchase.pricePaidInPaisa,
    productName: productDetails.name,
    ...getReturnUrls(gateway, purchase.id),
  });

  // The gateway's reference for this checkout (eSewa uuid / Khalti pidx /
  // Fonepay PRN) — what verifyAndFulfil asks the gateway about later.
  await updatePurchase(purchase.id, { gatewayCheckoutId: initiation.checkoutId });

  if (initiation.type === "redirect") {
    return {
      error: false,
      purchaseId: purchase.id,
      redirect: {
        url: initiation.url,
        method: initiation.method ?? "GET",
        formFields: initiation.formFields,
      },
      qr: null,
    };
  }

  return {
    error: false,
    purchaseId: purchase.id,
    redirect: null,
    qr: { qrString: initiation.qrString, expiresAt: initiation.expiresAt },
  };
}

/**
 * Owner-only wrapper around verifyAndFulfil for the success page. The
 * fulfilment logic itself lives in lib/verifyAndFulfil.ts, outside this
 * "use server" module, so it is not callable from the client.
 */
export async function confirmPurchase({ purchaseId }: { purchaseId: string }) {
  const { userId } = await getCurrentUser();
  const purchase = await db.query.PurchaseTable.findFirst({
    where: eq(PurchaseTable.id, purchaseId),
    columns: { userId: true },
  });
  // Same response for "not yours" and "doesn't exist" so this can't be
  // used to probe other users' purchase ids.
  if (purchase == null || userId == null || purchase.userId !== userId)
    return { error: true, status: "not_found" as const, message: "Purchase not found" };

  const { outcome } = await verifyAndFulfil(purchaseId, "success_page");
  switch (outcome) {
    case "completed":
      return { error: false, status: "completed" as const, message: "Purchase confirmed" };
    case "already_completed":
      return { error: false, status: "completed" as const, message: "Already confirmed" };
    case "pending":
    case "error":
      return { error: true, status: "pending" as const, message: "Payment is still being confirmed" };
    default:
      return { error: true, status: "failed" as const, message: "Payment could not be verified" };
  }
}

// Admin-only refund bookkeeping: removes course access, writes the negative
// ledger mirror of every sale entry (so instructor earnings net out), and
// marks the purchase refunded — all in one transaction. The money itself is
// returned manually in the gateway's merchant dashboard.
export async function revokeAccess({ purchaseId }: { purchaseId: string }) {
  await requireAdmin();

  const purchase = await db.query.PurchaseTable.findFirst({
    where: eq(PurchaseTable.id, purchaseId),
  });

  if (purchase == null) {
    return { error: true, message: "Purchase not found" };
  }

  await db.transaction(async (trx) => {
    // Mark refunded first: revokeUserCourseAccess keeps access to any course
    // the buyer still owns through another non-refunded purchase, so this
    // purchase must no longer count as one.
    const now = new Date();
    await trx
      .update(PurchaseTable)
      .set({ status: "refunded", refundedAt: now, updatedAt: now })
      .where(eq(PurchaseTable.id, purchaseId));

    await revokeUserCourseAccess(
      { userId: purchase.userId, productId: purchase.productId },
      trx,
    );

    await reverseLedgerEntriesForPurchase(purchaseId, trx);
  });

  revalidateProductCache(purchase.productId);

  return { error: false, message: "Access revoked successfully" };
}
