import "server-only";
import { eq } from "drizzle-orm";
import { DrizzleQueryError } from "drizzle-orm/errors";
import { db } from "@/drizzle/db";
import {
  CourseProductTable,
  PurchaseTable,
  UserTable,
} from "@/drizzle/schema";
import { addUserCourseAccess } from "@/features/courses/db/userCourseAccess";
import { recordDiscountRedemption } from "@/features/discounts/db/discounts";
import { generateAndSendInvoice } from "@/features/invoices/actions/generateAndSendInvoice";
import { createInvoiceForPurchase } from "@/features/invoices/db/invoices";
import { createLedgerEntry } from "@/features/ledger/db/ledger";
import { revalidateProductCache } from "@/features/products/db/cache";
import { isGatewayName, type GatewayName } from "@/services/payments/config";
import { getGateway } from "@/services/payments/gateways";
import type {
  PaymentVerifier,
  VerifyPaymentResult,
} from "@/services/payments/types";
import { revalidatePurchaseCache } from "../db/cache";
import {
  markPurchaseCompleted,
  markPurchaseDisputed,
  markPurchaseFailed,
} from "../db/purchases";
import { recordPaymentEvent } from "../db/paymentEvents";
import { captureError, captureEvent } from "@/lib/observability";

/** Who asked — recorded with every verification. */
export type FulfilSource = "return" | "poll" | "success_page" | "cron" | "admin";

export type FulfilOutcome =
  | "completed" // this call completed the purchase
  | "already_completed" // someone else did (or it was done before)
  | "pending"
  | "failed"
  | "disputed"
  | "error" // no answer from the gateway; nothing changed
  | "skipped" // nothing to verify (refunded, disputed, free, unknown gateway)
  | "not_found"; // no such purchase

export type FulfilResult = {
  outcome: FulfilOutcome;
  purchase: { id: string; productId: string; userId: string } | null;
};

/**
 * The seams used by tests. The app never passes these — verifyAndFulfil is
 * not a server action and every caller uses the defaults, so a test gateway
 * can't be selected from a request or from env.
 */
export type FulfilDeps = {
  getVerifier: (gateway: GatewayName) => PaymentVerifier | null;
  sendInvoice: (invoiceId: string) => Promise<void>;
};

export const defaultFulfilDeps: FulfilDeps = {
  getVerifier: getGateway,
  sendInvoice: generateAndSendInvoice,
};

const UNIQUE_VIOLATION = "23505";
// The (gateway, gatewayTransactionId) unique index on purchases. Only THIS
// conflict means "this payment already paid for another purchase"; any
// other unique conflict is an ordinary error, never a dispute.
const GATEWAY_TRANSACTION_UNIQUE_INDEX = "gateway_transaction_unique_idx";

// A gateway may not know about a payment the instant the buyer leaves its
// page. "No record" only becomes a failure after this long.
export const NOT_FOUND_GRACE_MS = 30 * 60 * 1000;

function isReusedGatewayTransaction(error: unknown) {
  const cause = error instanceof DrizzleQueryError ? error.cause : error;
  return (
    typeof cause === "object" &&
    cause != null &&
    "code" in cause &&
    cause.code === UNIQUE_VIOLATION &&
    "constraint" in cause &&
    cause.constraint === GATEWAY_TRANSACTION_UNIQUE_INDEX
  );
}

/**
 * Asks the purchase's gateway what happened and applies the answer — the
 * single place purchases get completed. Safe to call any number of times,
 * concurrently, from any source (return route, poll, cron, admin): the
 * gateway is the authority, the amount must match to the paisa, and the
 * status-guarded UPDATE lets exactly one caller fulfil.
 */
export async function verifyAndFulfil(
  purchaseId: string,
  source: FulfilSource,
  deps: FulfilDeps = defaultFulfilDeps,
): Promise<FulfilResult> {
  const purchase = await db.query.PurchaseTable.findFirst({
    where: eq(PurchaseTable.id, purchaseId),
  });
  if (purchase == null) return { outcome: "not_found", purchase: null };
  const ref = {
    id: purchase.id,
    productId: purchase.productId,
    userId: purchase.userId,
  };

  if (purchase.status === "completed") {
    return { outcome: "already_completed", purchase: ref };
  }
  // pending: normal. failed: re-checked because late success wins.
  // disputed / refunded / anything else: terminal for automated flows.
  if (purchase.status !== "pending" && purchase.status !== "failed") {
    return { outcome: "skipped", purchase: ref };
  }
  const event = {
    purchaseId: purchase.id,
    source,
    gateway: purchase.gateway,
  } as const;

  const verifier = isGatewayName(purchase.gateway)
    ? deps.getVerifier(purchase.gateway)
    : null;
  if (verifier == null) {
    // Gateway disabled or unknown in this deployment — can't ask it now.
    console.warn(
      `[payments] ${source}: cannot verify purchase ${purchase.id}, gateway ${purchase.gateway} is not enabled`,
    );
    captureEvent("Payment verification: gateway not enabled", {
      area: "payments",
      payment_event: "gateway_disabled",
      gateway: purchase.gateway,
      source,
    }, { level: "warning", extra: { purchaseId: purchase.id } });
    await recordPaymentEvent({ ...event, outcome: "error", detail: { reason: "gateway not enabled" } });
    return { outcome: "error", purchase: ref };
  }

  let verification: VerifyPaymentResult;
  try {
    verification = await verifier.verify({
      purchaseId: purchase.id,
      gatewayCheckoutId: purchase.gatewayCheckoutId,
      expectedAmountInPaisa: purchase.pricePaidInPaisa,
    });
  } catch (error) {
    console.error(`[payments] ${source}: verify failed for ${purchase.id}`, error);
    captureError(error, { area: "payments", payment_event: "verify_error", gateway: purchase.gateway, source }, { purchaseId: purchase.id });
    await recordPaymentEvent({ ...event, outcome: "error", detail: { reason: "verify threw" } });
    return { outcome: "error", purchase: ref };
  }
  const reported = {
    gatewayStatus: verification.gatewayStatus,
    amountInPaisa: verification.amountInPaisa,
  };

  switch (verification.status) {
    case "completed":
      break;
    case "pending":
      await recordPaymentEvent({ ...event, ...reported, outcome: "pending" });
      return { outcome: "pending", purchase: ref };
    case "error":
      // The gateway didn't give a usable answer (network, 5xx, unexpected
      // body). Nothing changes; the cron retries.
      captureEvent("Payment verification: gateway error", {
        area: "payments",
        payment_event: "gateway_error",
        gateway: purchase.gateway,
        source,
      }, { level: "warning", extra: { purchaseId: purchase.id, gatewayStatus: verification.gatewayStatus } });
      await recordPaymentEvent({ ...event, ...reported, outcome: "error", detail: verification.raw });
      return { outcome: "error", purchase: ref };
    case "not_found":
    case "failed": {
      const withinGrace =
        verification.status === "not_found" &&
        Date.now() - purchase.createdAt.getTime() < NOT_FOUND_GRACE_MS;
      if (withinGrace || purchase.status === "failed") {
        // Too early to call it — or already failed, nothing new to record.
        if (withinGrace) await recordPaymentEvent({ ...event, ...reported, outcome: "pending" });
        return { outcome: purchase.status === "failed" ? "failed" : "pending", purchase: ref };
      }
      const failed = await markPurchaseFailed({
        id: purchase.id,
        rawGatewayResponse: verification.raw,
      });
      if (failed == null) {
        // Raced with another transition — report what actually happened.
        const now = await db.query.PurchaseTable.findFirst({
          where: eq(PurchaseTable.id, purchase.id),
          columns: { status: true },
        });
        return {
          outcome: now?.status === "completed" ? "already_completed" : now?.status === "disputed" ? "disputed" : "skipped",
          purchase: ref,
        };
      }
      revalidatePurchaseCache(purchase);
      await recordPaymentEvent({ ...event, ...reported, outcome: "failed" });
      return { outcome: "failed", purchase: ref };
    }
  }

  // The gateway says "paid" — but only the exact amount, in paisa, counts.
  if (verification.amountInPaisa !== purchase.pricePaidInPaisa) {
    console.error(
      `[payments] ${source}: amount mismatch for ${purchase.id}: expected ${purchase.pricePaidInPaisa}, gateway reported ${verification.amountInPaisa}`,
    );
    captureEvent("Payment verification: amount mismatch", {
      area: "payments",
      payment_event: "amount_mismatch",
      gateway: purchase.gateway,
      source,
    }, {
      extra: {
        purchaseId: purchase.id,
        expectedAmountInPaisa: purchase.pricePaidInPaisa,
        reportedAmountInPaisa: verification.amountInPaisa,
      },
    });
    await markPurchaseDisputed({ id: purchase.id, rawGatewayResponse: verification.raw });
    revalidatePurchaseCache(purchase);
    await recordPaymentEvent({
      ...event,
      ...reported,
      outcome: "disputed",
      detail: { reason: "amount mismatch", expectedAmountInPaisa: purchase.pricePaidInPaisa },
    });
    return { outcome: "disputed", purchase: ref };
  }

  let fulfilled: { id: string; userId: string; productId: string; invoiceId: string } | null;
  try {
    fulfilled = await fulfil(purchase.id, verification);
  } catch (error) {
    if (isReusedGatewayTransaction(error)) {
      // The gateway's transaction reference is already attached to another
      // purchase: one payment can't pay for two purchases.
      console.error(
        `[payments] ${source}: transaction ${verification.gatewayTransactionId} already used — disputing ${purchase.id}`,
      );
      captureEvent("Payment verification: transaction id already used", {
        area: "payments",
        payment_event: "reused_transaction",
        gateway: purchase.gateway,
        source,
      }, { extra: { purchaseId: purchase.id, gatewayTransactionId: verification.gatewayTransactionId } });
      await markPurchaseDisputed({ id: purchase.id, rawGatewayResponse: verification.raw });
      revalidatePurchaseCache(purchase);
      await recordPaymentEvent({
        ...event,
        ...reported,
        outcome: "disputed",
        detail: { reason: "transaction id already used", gatewayTransactionId: verification.gatewayTransactionId },
      });
      return { outcome: "disputed", purchase: ref };
    }
    console.error(`[payments] ${source}: fulfilment failed for ${purchase.id}`, error);
    captureError(error, { area: "payments", payment_event: "fulfilment_error", gateway: purchase.gateway, source }, { purchaseId: purchase.id });
    await recordPaymentEvent({ ...event, ...reported, outcome: "error", detail: { reason: "fulfilment failed" } });
    return { outcome: "error", purchase: ref };
  }

  if (fulfilled == null) {
    await recordPaymentEvent({ ...event, ...reported, outcome: "already_completed" });
    return { outcome: "already_completed", purchase: ref };
  }
  await recordPaymentEvent({ ...event, ...reported, outcome: "completed" });

  revalidatePurchaseCache(fulfilled);
  revalidateProductCache(fulfilled.productId);

  // Fire-and-forget, deliberately outside the transaction: PDF rendering
  // and email delivery are external I/O and must never roll back a
  // purchase that's already committed. invoice.pdfR2Key/emailedAt staying
  // null is the retry signal.
  deps.sendInvoice(fulfilled.invoiceId).catch(error => {
    console.error(`Invoice generation/send failed for purchase ${fulfilled.id}`, error);
  });

  return { outcome: "completed", purchase: ref };
}

/**
 * One transaction: status → completed (guarded), discount redemption,
 * course access, ledger, invoice row. Returns null when another caller
 * already completed the purchase.
 */
async function fulfil(purchaseId: string, verification: VerifyPaymentResult) {
  return db.transaction(async trx => {
    // First statement, and it takes the row lock: a concurrent fulfil
    // blocks here, then finds status = "completed" and gets no row.
    const completed = await markPurchaseCompleted(
      {
        id: purchaseId,
        gatewayTransactionId: verification.gatewayTransactionId,
        rawGatewayResponse: verification.raw,
      },
      trx,
    );
    if (completed == null) return null;

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
    const courseIds = courseProducts.map(cp => cp.course.id);

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

    const buyer = await trx.query.UserTable.findFirst({
      where: eq(UserTable.id, completed.userId),
    });
    if (buyer == null) {
      throw new Error(`Buyer ${completed.userId} not found while creating invoice`);
    }

    const invoice = await createInvoiceForPurchase(
      {
        purchase: completed,
        buyer: { id: buyer.id, name: buyer.name, email: buyer.email },
        lineItems: courseProducts.map(cp => ({
          description: cp.course.name,
          amountPaisa: splitAmountPaisa,
        })),
      },
      trx,
    );

    return {
      id: completed.id,
      userId: completed.userId,
      productId: completed.productId,
      invoiceId: invoice.id,
    };
  });
}
