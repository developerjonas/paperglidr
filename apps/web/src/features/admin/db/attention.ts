import "server-only"
import { sql } from "drizzle-orm"
import { db } from "@/drizzle/db"

/** Things waiting on an admin. Shown on the Overview and as sidebar badges. */
export type AttentionCounts = {
  /** Courses (products) creators submitted for review. */
  productsPending: number
  /** Refund requests to decide (pending) or pay back (approved). */
  refunds: number
  /** Creator payout requests to pay or reject. */
  payouts: number
  /** Gateway payments still pending after an hour (paid-but-no-access risk). */
  stuckPayments: number
  /** Payments the gateway confirmed with a wrong amount or a reused transaction. */
  disputedPayments: number
  /** Support tickets open or in progress. */
  openTickets: number
  /** Reports not yet dealt with. */
  reports: number
}

export async function getAttentionCounts(): Promise<AttentionCounts> {
  const result = await db.execute(sql`
    select
      (select count(*) from products where status = 'pending_review') as products_pending,
      (select count(*) from refund_requests where status in ('pending', 'approved')) as refunds,
      (select count(*) from payouts where status = 'requested') as payouts,
      (select count(*) from purchases
        where status = 'pending' and gateway <> 'free' and "createdAt" < now() - interval '1 hour') as stuck_payments,
      (select count(*) from purchases where status = 'disputed') as disputed_payments,
      (select count(*) from support_tickets where status in ('open', 'in_progress')) as open_tickets,
      (select count(*) from reports where status in ('pending', 'reviewing')) as reports
  `)
  const row = result.rows[0] as Record<string, unknown>
  const n = (key: string) => Number(row[key] ?? 0)
  return {
    productsPending: n("products_pending"),
    refunds: n("refunds"),
    payouts: n("payouts"),
    stuckPayments: n("stuck_payments"),
    disputedPayments: n("disputed_payments"),
    openTickets: n("open_tickets"),
    reports: n("reports"),
  }
}
