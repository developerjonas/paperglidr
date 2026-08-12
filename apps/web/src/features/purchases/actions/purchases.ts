// features/purchases/actions/purchases.ts (add back into the file)
"use server";
import { db } from "@/drizzle/db";
import {
  CourseProductTable,
  ProductTable,
  PurchaseTable,
  UserCourseAccessTable,
  UserTable,
} from "@/drizzle/schema";
import { and, eq, inArray } from "drizzle-orm";
import {
  insertPurchase,
  getPurchaseByIdempotencyKey,
  updatePurchase,
  markPurchaseCompleted,
} from "../db/purchases";
import { getReferringInstructorId } from "../db/referral";
import { esewaGateway } from "@/services/payments/esewa/esewaServer";
import { khaltiGateway } from "@/services/payments/khalti/khaltiServer";
import { fonepayGateway } from "@/services/payments/fonepay/fonepayServer";
import { auth } from "@/lib/auth"; // ASSUMPTION: however you currently get the logged-in user server-side
import { headers } from "next/headers";
import { addUserCourseAccess } from "@/features/courses/db/userCourseAcccess";
import { createLedgerEntry } from "@/features/ledger/db/ledger";
import { createInvoiceForPurchase } from "@/features/invoices/db/invoices";
import { revalidateProductCache } from "@/features/products/db/cache";
import { generateAndSendInvoice } from "@/features/invoices/actions/generateAndSendInvoice";
import { validateDiscountCode } from "@/features/discounts/lib/validateDiscountCode";
import { recordDiscountRedemption } from "@/features/discounts/db/discounts";

const gateways = {
  esewa: esewaGateway,
  khalti: khaltiGateway,
  fonepay: fonepayGateway,
} as const;
type WiredGateway = keyof typeof gateways;

export async function initiatePurchase({
  productId,
  gateway,
  idempotencyKey,
  discountCode,
}: {
  productId: string;
  gateway: WiredGateway | "free";
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

  const wiredGateway = gateways[gateway];
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

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL!;

  const initiation = await wiredGateway.initiate({
    purchaseId: purchase.id,
    amountInPaisa: purchase.pricePaidInPaisa,
    productName: productDetails.name,
    successUrl: `${baseUrl}/products/${productId}/purchase/success?purchaseId=${purchase.id}`,
    failureUrl: `${baseUrl}/products/purchase-failure?purchaseId=${purchase.id}`,
  });

  if (initiation.gatewayTransactionId != null) {
    await updatePurchase(purchase.id, {
      gatewayTransactionId: initiation.gatewayTransactionId,
    });
  }

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

export async function confirmPurchase({ purchaseId }: { purchaseId: string }) {
  const purchase = await db.query.PurchaseTable.findFirst({
    where: eq(PurchaseTable.id, purchaseId),
  });
  if (purchase == null) return { error: true, message: "Purchase not found" };
  if (purchase.status === "completed")
    return { error: false, message: "Already confirmed" };

  const verification = await gateways[purchase.gateway as WiredGateway].verify({
    gatewayCheckoutId: purchase.gatewayCheckoutId,
    gatewayTransactionId: purchase.gatewayTransactionId,
    amountInPaisa: purchase.pricePaidInPaisa,
  });
  if (!verification.verified)
    return { error: true, message: "Payment could not be verified" };

  const result = await db.transaction(async (trx) => {
    const completed = await markPurchaseCompleted(
      {
        id: purchase.id,
        gatewayTransactionId:
          verification.gatewayTransactionId ??
          purchase.gatewayTransactionId ??
          "",
        rawGatewayResponse: verification.raw,
      },
      trx,
    );
    if (completed == null) return null;

    // Record the redemption atomically with completion — if verification
    // succeeded but something downstream in this transaction throws, the
    // whole thing rolls back including this, so the code's usage count
    // never drifts from reality.
    if (completed.discountCodeId != null) {
      await recordDiscountRedemption(
        {
          discountCodeId: completed.discountCodeId,
          userId: completed.userId,
          purchaseId: completed.id,
          amountDiscountedInPaisa: completed.discountAmountPaisa ?? 0,
        },
        trx,
      );
    }

    const courseProducts = await trx.query.CourseProductTable.findMany({
      where: eq(CourseProductTable.productId, completed.productId),
      with: { course: { columns: { id: true, authorId: true, name: true } } },
    });
    const courseIds = courseProducts.map((cp) => cp.course.id);

    await addUserCourseAccess({ userId: completed.userId, courseIds }, trx);

    const splitAmountPaisa = Math.floor(
      completed.pricePaidInPaisa / courseProducts.length,
    );
    for (const cp of courseProducts) {
      await createLedgerEntry(
        {
          purchaseId: completed.id,
          courseId: cp.course.id,
          instructorId: cp.course.authorId,
          grossAmountPaisa: splitAmountPaisa,
          referredByInstructorId: completed.referredByInstructorId,
        },
        trx,
      );
    }

    // Buyer details for the invoice — confirmPurchase never touched
    // UserTable before this, so this is a new lookup.
    const buyer = await trx.query.UserTable.findFirst({
      where: eq(UserTable.id, completed.userId),
    });
    if (buyer == null)
      throw new Error(
        `Buyer ${completed.userId} not found while creating invoice`,
      );

    const invoice = await createInvoiceForPurchase(
      {
        purchase: completed,
        buyer: { id: buyer.id, name: buyer.name, email: buyer.email },
        lineItems: courseProducts.map((cp) => ({
          description: cp.course.name,
          amountPaisa: splitAmountPaisa,
        })),
      },
      trx,
    );

    return { ...completed, invoiceId: invoice.id };
  });

  if (result == null) return { error: false, message: "Already processed" };

  revalidateProductCache(result.productId);

  // Fire-and-forget, deliberately outside the transaction: PDF rendering
  // and email delivery are external I/O and must never roll back a
  // purchase that's already committed. Failure here is logged, not thrown —
  // invoice.pdfR2Key/emailedAt staying null is the retry signal for later.
  generateAndSendInvoice(result.invoiceId).catch((err) => {
    console.error(
      `Invoice generation/send failed for purchase ${result.id}`,
      err,
    );
  });

  return { error: false, message: "Purchase confirmed" };
}

export async function revokeAccess({ purchaseId }: { purchaseId: string }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session?.user == null) return { error: true, message: "Not signed in" };

  const purchase = await db.query.PurchaseTable.findFirst({
    where: eq(PurchaseTable.id, purchaseId),
  });

  if (purchase == null) {
    return { error: true, message: "Purchase not found" };
  }

  const courseProducts = await db.query.CourseProductTable.findMany({
    where: eq(CourseProductTable.productId, purchase.productId),
  });

  const courseIds = courseProducts.map((cp) => cp.courseId);

  await db.transaction(async (trx) => {
    if (courseIds.length > 0) {
      await trx
        .delete(UserCourseAccessTable)
        .where(
          and(
            eq(UserCourseAccessTable.userId, purchase.userId),
            inArray(UserCourseAccessTable.courseId, courseIds),
          ),
        );
    }

    await trx
      .update(PurchaseTable)
      .set({ status: "refunded", updatedAt: new Date() })
      .where(eq(PurchaseTable.id, purchaseId));
  });

  revalidateProductCache(purchase.productId);

  return { error: false, message: "Access revoked successfully" };
}
