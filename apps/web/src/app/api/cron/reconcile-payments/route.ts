import crypto from "crypto";
import { NextResponse } from "next/server";
import { env } from "@/data/env/server";
import { reconcilePayments } from "@/features/purchases/lib/reconcilePayments";
import { routeError } from "@/lib/safeError";
import { captureError } from "@/lib/observability";
import { retryInvoiceDeliveries } from "@/features/invoices/lib/deliverInvoice";
import { cleanUpUploads } from "@/features/lessons/lib/uploadCleanup";
import { syncPendingBunnyVideos } from "@/features/lessons/lib/bunnyVideos";
import { getBunnyConfig } from "@/services/bunny/stream";

// Each run is kept short enough for an external scheduler's request
// timeout (cron-job.org gives up after 30s): payment checks stop starting
// after RUN_BUDGET_MS and the rest wait for the next run, 5 minutes later.
export const maxDuration = 60;
const RUN_BUDGET_MS = 20_000;
const BATCH_SIZE = 25;

// Scheduled every 5 minutes on cron-job.org (docs/PAYMENTS.md, "Cron"),
// not Vercel Cron: the Hobby plan only allows daily runs. The GlitchTip
// heartbeat monitor's interval must match (docs/SETUP.md, "Alerts").

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
  const startedAt = Date.now();
  // Payment reconciliation keeps its summary at the top level (other
  // tools read { checked, outcomes }); a failure here fails the run.
  const payments = await reconcilePayments({ limit: BATCH_SIZE, timeBudgetMs: RUN_BUDGET_MS });
  // Housekeeping only if there's time left; otherwise next run.
  const timeLeft = () => Date.now() - startedAt < RUN_BUDGET_MS;
  const invoices = timeLeft() ? await step("invoice retry", () => retryInvoiceDeliveries()) : { skipped: "time budget" };
  // Lesson videos whose Bunny webhook was missed: before the cleanup, so a
  // finished video is made ready instead of being deleted as abandoned.
  const videos =
    getBunnyConfig() == null
      ? { skipped: "bunny not configured" }
      : timeLeft()
        ? await step("upload cleanup", () => syncPendingBunnyVideos())
        : { skipped: "time budget" };
  const uploads = timeLeft() ? await step("upload cleanup", () => cleanUpUploads()) : { skipped: "time budget" };
  return { ...payments, invoices, videos, uploads };
}

/**
 * Payment reconciliation, then invoice retries and upload cleanup.
 * Scheduler-agnostic: any caller presenting
 * `Authorization: Bearer <CRON_SECRET>` may trigger it (set that header on
 * the cron-job.org job; Vercel Cron would send it too). Without CRON_SECRET
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
    const summary = await runJobs();
    console.info("[payments] cron reconcile", summary);
    // Tell the GlitchTip heartbeat monitor this run succeeded. It alerts
    // when a run fails or the scheduler stops calling this at all
    // (docs/SETUP.md, "Alerts"). Unset = no heartbeat.
    await sendHeartbeat();
    return NextResponse.json(summary);
  } catch (error) {
    return routeError(error, "payments: cron reconcile", 500, "Reconciliation failed", { area: "payments" });
  }
}

async function sendHeartbeat() {
  const url = env.CRON_HEARTBEAT_URL;
  if (!url) return;
  try {
    await fetch(url, { method: "POST", signal: AbortSignal.timeout(5_000) });
  } catch (error) {
    // A monitoring hiccup must never fail the payment run; the heartbeat
    // monitor will alert on its own if pings keep failing.
    console.warn("[payments] cron heartbeat failed", error);
  }
}

export const GET = handle;
export const POST = handle;
