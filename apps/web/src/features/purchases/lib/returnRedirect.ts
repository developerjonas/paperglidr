import "server-only";
import { NextResponse } from "next/server";
import { z } from "zod";
import { env as clientEnv } from "@/data/env/client";
import type { FulfilResult } from "./verifyAndFulfil";

export const purchaseIdSchema = z.string().uuid();

/**
 * Sends the buyer's browser to the page matching what the gateway said.
 * Never decides anything itself — the outcome comes from verifyAndFulfil.
 */
export function redirectForOutcome({ outcome, purchase }: FulfilResult) {
  const base = clientEnv.NEXT_PUBLIC_APP_URL;
  if (purchase == null) {
    return NextResponse.redirect(`${base}/products/purchase-failure`, 303);
  }
  switch (outcome) {
    case "completed":
    case "already_completed":
    case "pending": // the success page shows "still confirming" and re-checks
    case "error":
      return NextResponse.redirect(
        `${base}/products/${purchase.productId}/purchase/success?purchaseId=${purchase.id}`,
        303,
      );
    default:
      return NextResponse.redirect(
        `${base}/products/purchase-failure?purchaseId=${purchase.id}`,
        303,
      );
  }
}
