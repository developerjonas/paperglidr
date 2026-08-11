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
}: {
  productId: string;
  gateway: WiredGateway | "free";
  // Client generates and holds this (e.g. crypto.randomUUID() on mount /
  // on "Buy" click) so a retried request or double-click resolves to the
  // same purchase row instead of creating a duplicate.
  idempotencyKey: string;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session?.user == null) return { error: true, message: "Not signed in" };

  // Idempotency short-circuit — if this exact attempt was already inserted
  // (retry, double submit), return what's already there instead of
  // re-initiating with the gateway a second time.
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

  // ASSUMPTION: ProductTable has a priceInPaisa column. Adjust the field
  // name here if it's actually priceInCents / priceInDollars / etc.
  const pricePaidInPaisa = Math.round(product.priceInRupees * 100);
  const referredByInstructorId = await getReferringInstructorId();

  const productDetails = {
    name: product.name,
    description: product.description,
    imageUrl: product.imageUrl,
  };

  // Free products skip the gateway entirely — no checkout to initiate,
  // nothing to verify later. Insert directly as completed; confirmPurchase's
  // downstream logic (course access, ledger, invoice) still needs to run,
  // so we call it immediately with a synthetic already-verified path.
  if (gateway === "free" || pricePaidInPaisa === 0) {
    const purchase = await insertPurchase({
      userId: session.user.id,
      productId,
      productDetails,
      pricePaidInPaisa: 0,
      gateway: "free",
      status: "pending", // confirmPurchase flips this to completed
      gatewayCheckoutId: idempotencyKey,
      idempotencyKey,
      referredByInstructorId,
    });
    if (purchase == null)
      return { error: true, message: "Could not start free purchase" };

    return {
      error: false,
      purchaseId: purchase.id,
      redirectUrl: null,
      isFree: true,
    };
    // Caller is expected to immediately invoke confirmPurchase({ purchaseId })
    // client-side for the free path, same as a paid gateway's success redirect would.
  }

  const wiredGateway = gateways[gateway];
  if (wiredGateway == null)
    return { error: true, message: "Unsupported payment method" };

  // Insert as pending BEFORE calling the gateway, so idempotencyKey is
  // claimed first — if the gateway call fails/times out after this point,
  // a retry with the same idempotencyKey finds this row rather than
  // racing a second insert.
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
  });
  if (purchase == null)
    return { error: true, message: "Could not start purchase" };

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL!;

  // ASSUMPTION: each gateway module exposes an `initiate` method shaped
  // like this. Adjust to match esewaServer.ts / khaltiServer.ts /
  // fonepayServer.ts's actual exported function names and return shape.
  const initiation = await wiredGateway.initiate({
    purchaseId: purchase.id,
    amountInPaisa: purchase.pricePaidInPaisa,
    productName: productDetails.name,
    successUrl: `${baseUrl}/products/${productId}/purchase/success?purchaseId=${purchase.id}`,
    failureUrl: `${baseUrl}/products/purchase-failure?purchaseId=${purchase.id}`,
  });

  // Some gateways assign a transaction id at initiate time (Khalti), others
  // only assign it once payment completes (eSewa) — persist it now if we
  // have it so confirmPurchase/verify has something to work with either way.
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

  // type === "qr"
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
