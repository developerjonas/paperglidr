import crypto from "crypto";
import { NextResponse } from "next/server";
import { env } from "@/data/env/server";
import { reconcilePayments } from "@/features/purchases/lib/reconcilePayments";
import { routeError } from "@/lib/safeError";

// Batch of up to 50 gateway checks at concurrency 5.
export const maxDuration = 60;

// Constant-time compare that doesn't leak the secret's length.
function secretMatches(presented: string, secret: string) {
  const a = crypto.createHash("sha256").update(presented).digest();
  const b = crypto.createHash("sha256").update(secret).digest();
  return crypto.timingSafeEqual(a, b);
}

/**
 * Payment reconciliation. Scheduler-agnostic: any caller presenting
 * `Authorization: Bearer <CRON_SECRET>` may trigger it (Vercel Cron sends
 * exactly that header when CRON_SECRET is set). Without CRON_SECRET
 * configured, every request is refused.
 */
async function handle(request: Request) {
  const secret = env.CRON_SECRET;
  const header = request.headers.get("authorization") ?? "";
  const presented = header.startsWith("Bearer ") ? header.slice("Bearer ".length) : "";
  if (!secret || !presented || !secretMatches(presented, secret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const summary = await reconcilePayments();
    console.info("[payments] cron reconcile", summary);
    return NextResponse.json(summary);
  } catch (error) {
    return routeError(error, "payments: cron reconcile", 500, "Reconciliation failed");
  }
}

export const GET = handle;
export const POST = handle;
