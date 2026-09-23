"use server";

import { requireAdmin } from "@/services/auth";
import { verifyAndFulfil } from "../lib/verifyAndFulfil";

const OUTCOME_MESSAGES = {
  completed: "Payment confirmed — purchase completed and access granted.",
  already_completed: "Already completed.",
  pending: "Gateway says the payment is still pending.",
  failed: "Gateway reports the payment failed.",
  disputed: "Amount or transaction mismatch — marked disputed. Needs manual review.",
  error: "Couldn't get an answer from the gateway. Try again later.",
  skipped: "Nothing to re-check for this purchase's status.",
  not_found: "Purchase not found.",
} as const;

/** Admin "Re-check payment": asks the gateway now, exactly like the cron. */
export async function recheckPurchasePayment(purchaseId: string) {
  await requireAdmin();
  const { outcome } = await verifyAndFulfil(purchaseId, "admin");
  return {
    error: outcome === "error" || outcome === "not_found",
    message: OUTCOME_MESSAGES[outcome],
  };
}
