import crypto from "crypto";
import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";
import { env } from "@/data/env/server";
import { reconcilePayments } from "@/features/purchases/lib/reconcilePayments";
import { routeError } from "@/lib/safeError";
import { captureError } from "@/lib/observability";
import { retryInvoiceDeliveries } from "@/features/invoices/lib/deliverInvoice";
import { cleanUpUploads } from "@/features/lessons/lib/uploadCleanup";

// Batch of up to 50 gateway checks at concurrency 5.
export const maxDuration = 60;

// Must match apps/web/vercel.json.
const CRON_SCHEDULE = "*/5 * * * *";

// Constant-time compare that doesn't leak the secret's length.
function secretMatches(presented: string, secret: string) {
  const a = crypto.createHash("sha256").update(presented).digest();
  const b = crypto.createHash("sha256").update(secret).digest();
  return crypto.timingSafeEqual(a, b);
}

// Housekeeping that rides on the same schedule. Each job is isolated: one
// failing (reported to Sentry) doesn't stop the others or fail the run.
async function step<T>(name: string, job: () => Promise<T>) {
  try {
    return await job();
  } catch (error) {
    captureError(error, { area: name === "upload cleanup" ? "cleanup" : "payments", context: `cron: ${name}` });
    console.error(`[cron] ${name} failed`, error);
    return { error: true };
  }
}

async function runJobs() {
  // Payment reconciliation keeps its summary at the top level (other
  // tools read { checked, outcomes }); a failure here fails the run.
  const payments = await reconcilePayments();
  const invoices = await step("invoice retry", () => retryInvoiceDeliveries());
  const uploads = await step("upload cleanup", () => cleanUpUploads());
  return { ...payments, invoices, uploads };
}

/**
 * Payment reconciliation, then invoice retries and upload cleanup.
 * Scheduler-agnostic: any caller presenting
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
    // A Sentry cron monitor (created on the first check-in when SENTRY_DSN
    // is set): it alerts when a run fails, or when the scheduler stops
    // calling this at all. No-op without Sentry.
    const summary = await Sentry.withMonitor("reconcile-payments", runJobs, {
      schedule: { type: "crontab", value: CRON_SCHEDULE },
      checkinMargin: 5,
      maxRuntime: 2,
    });
    console.info("[payments] cron reconcile", summary);
    return NextResponse.json(summary);
  } catch (error) {
    return routeError(error, "payments: cron reconcile", 500, "Reconciliation failed", { area: "payments" });
  }
}

export const GET = handle;
export const POST = handle;
