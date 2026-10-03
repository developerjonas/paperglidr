import "server-only"
import { sql } from "drizzle-orm"
import { db } from "@/drizzle/db"
import { PAYOUT_HOLD_MS } from "@/features/payouts/db/payouts"

// What each creator earned, what Chiyali kept, and what's owed: the
// ledger (sales and refund reversals) and payouts, per creator.

export const COMMISSION_PERIODS = ["30d", "90d", "365d", "all"] as const
export type CommissionPeriod = (typeof COMMISSION_PERIODS)[number]
const PERIOD_DAYS: Record<CommissionPeriod, number | null> = { "30d": 30, "90d": 90, "365d": 365, all: null }

type Row = Record<string, unknown>

export type CreatorCommission = {
  creatorId: string
  name: string
  email: string
  handle: string | null
  sales: number
  refunds: number
  grossPaisa: number
  platformFeePaisa: number
  earningsPaisa: number
  viaCreatorLinkPaisa: number
  paidOutPaisa: number
  requestedPaisa: number
  heldPaisa: number
  availablePaisa: number
}

/**
 * One row per creator with any ledger entry or payout. Period columns
 * (sales … viaCreatorLink) count entries in the period; balance columns
 * (paid out, requested, held, available) are as of now and match
 * getInstructorBalances: held = earnings from sales still in the refund
 * window; available = the rest, minus payouts paid or requested.
 */
export async function getCreatorCommissions({ period, creatorId }: { period: CommissionPeriod; creatorId?: string }) {
  const days = PERIOD_DAYS[period]
  const since = days == null ? null : new Date(Date.now() - days * 86_400_000)
  const cutoff = new Date(Date.now() - PAYOUT_HOLD_MS)
  const inPeriod = since == null ? sql`true` : sql`l."createdAt" >= ${since}`

  const result = (
    await db.execute(sql`
      with creators as (
        select "instructorId" as id from ledger_entries
        union select "instructorId" from payouts
      ),
      ledger as (
        select l."instructorId" as id,
          count(*) filter (where l."entryType" = 'sale' and ${inPeriod}) as sales,
          count(*) filter (where l."entryType" = 'refund' and ${inPeriod}) as refunds,
          coalesce(sum(l."grossAmountPaisa") filter (where ${inPeriod}), 0) as gross,
          coalesce(sum(l."platformFeePaisa") filter (where ${inPeriod}), 0) as fee,
          coalesce(sum(l."creatorEarningsPaisa") filter (where ${inPeriod}), 0) as earnings,
          coalesce(sum(l."grossAmountPaisa") filter (where ${inPeriod} and l."revenueSource" = 'instructor_link'), 0) as via_link,
          coalesce(sum(l."creatorEarningsPaisa") filter (where p."createdAt" <= ${cutoff}), 0) as settled,
          coalesce(sum(l."creatorEarningsPaisa") filter (where p."createdAt" > ${cutoff}), 0) as held
        from ledger_entries l join purchases p on p.id = l."purchaseId"
        group by l."instructorId"
      ),
      paid as (
        select "instructorId" as id,
          coalesce(sum("amountPaisa") filter (where status = 'paid'), 0) as paid_out,
          coalesce(sum("amountPaisa") filter (where status = 'requested'), 0) as requested
        from payouts group by "instructorId"
      )
      select c.id, u.name, u.email, i.handle,
        coalesce(l.sales, 0) as sales, coalesce(l.refunds, 0) as refunds, coalesce(l.gross, 0) as gross, coalesce(l.fee, 0) as fee,
        coalesce(l.earnings, 0) as earnings, coalesce(l.via_link, 0) as via_link, coalesce(l.settled, 0) as settled,
        coalesce(l.held, 0) as held, coalesce(pa.paid_out, 0) as paid_out, coalesce(pa.requested, 0) as requested
      from creators c
      join "user" u on u.id = c.id
      left join instructors i on i."userId" = c.id
      left join ledger l on l.id = c.id
      left join paid pa on pa.id = c.id
      where ${creatorId ? sql`c.id = ${creatorId}` : sql`true`}
      order by coalesce(l.gross, 0) desc, u.name
    `)
  ).rows as Row[]

  return result.map(
    (r): CreatorCommission => ({
      creatorId: String(r.id),
      name: String(r.name),
      email: String(r.email),
      handle: r.handle == null ? null : String(r.handle),
      sales: Number(r.sales),
      refunds: Number(r.refunds),
      grossPaisa: Number(r.gross),
      platformFeePaisa: Number(r.fee),
      earningsPaisa: Number(r.earnings),
      viaCreatorLinkPaisa: Number(r.via_link),
      paidOutPaisa: Number(r.paid_out),
      requestedPaisa: Number(r.requested),
      heldPaisa: Math.max(Number(r.held), 0),
      availablePaisa: Number(r.settled) - Number(r.paid_out) - Number(r.requested),
    }),
  )
}

/** A creator's latest ledger entries, newest first. */
export async function getCreatorLedger(creatorId: string, limit = 100) {
  const result = (
    await db.execute(sql`
      select l.id, l."entryType" as entry_type, l."revenueSource" as source, l."platformFeeRateBps" as fee_bps,
        l."grossAmountPaisa" as gross, l."platformFeePaisa" as fee, l."creatorEarningsPaisa" as earnings, l."createdAt" as created_at,
        l."purchaseId" as purchase_id, c.name as course
      from ledger_entries l join courses c on c.id = l."courseId"
      where l."instructorId" = ${creatorId}
      order by l."createdAt" desc limit ${limit}
    `)
  ).rows as Row[]
  return result.map((r) => ({
    id: String(r.id),
    entryType: String(r.entry_type),
    source: String(r.source),
    feeBps: Number(r.fee_bps),
    grossPaisa: Number(r.gross),
    feePaisa: Number(r.fee),
    earningsPaisa: Number(r.earnings),
    createdAt: new Date(String(r.created_at)),
    purchaseId: String(r.purchase_id),
    course: String(r.course),
  }))
}
