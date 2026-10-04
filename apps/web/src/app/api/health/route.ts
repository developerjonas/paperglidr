import { NextResponse } from "next/server"
import { sql } from "drizzle-orm"
import { db } from "@/drizzle/db"
import {
  CourseTable,
  LessonAssetTable,
  LessonTable,
  ProductTable,
  PurchaseTable,
  SessionTable,
  UserTable,
} from "@/drizzle/schema"
import { captureEvent } from "@/lib/observability"

// Always run, never cache: an uptime checker must see the live state.
export const dynamic = "force-dynamic"

const TIMEOUT_MS = 5_000

// The tables every page and sign-in touch. Selecting zero rows still makes
// Postgres check every column the code names, so a missing migration
// ("column … does not exist") fails here instead of on a customer's page.
const CORE_TABLES = [UserTable, SessionTable, ProductTable, CourseTable, LessonTable, LessonAssetTable, PurchaseTable]

type Check = "ok" | "fail"

function withTimeout<T>(promise: Promise<T>) {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error("timed out")), TIMEOUT_MS)),
  ])
}

/**
 * GET /api/health — for uptime monitors (UptimeRobot, Better Stack…).
 * 200 `{ status: "ok" }` when the app can reach the database and its
 * schema matches the code; 503 `{ status: "fail" }` otherwise, naming the
 * check that failed but never the error. Public, cheap, uncached.
 * docs/SETUP.md ("Uptime checks") has the monitor settings.
 */
async function check() {
  const started = Date.now()
  const checks: { database: Check; schema: Check } = { database: "fail", schema: "fail" }

  try {
    await withTimeout(db.execute(sql`select 1`))
    checks.database = "ok"
    await withTimeout(Promise.all(CORE_TABLES.map(table => db.select().from(table).limit(0))))
    checks.schema = "ok"
  } catch (error) {
    captureEvent("Health check failed", { area: "health" }, { extra: { checks, error: String(error) } })
  }

  const ok = checks.database === "ok" && checks.schema === "ok"
  return NextResponse.json(
    {
      status: ok ? "ok" : "fail",
      checks,
      responseMs: Date.now() - started,
      // Which deployment answered (Vercel sets these); handy during a rollback.
      commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? null,
      region: process.env.VERCEL_REGION ?? null,
    },
    { status: ok ? 200 : 503, headers: { "Cache-Control": "no-store, max-age=0" } },
  )
}

export async function GET() {
  return check()
}

// Some monitors send HEAD: same checks, status code only.
export async function HEAD() {
  const response = await check()
  return new Response(null, { status: response.status, headers: { "Cache-Control": "no-store, max-age=0" } })
}
