import "server-only"
import { sql } from "drizzle-orm"
import { db } from "@/drizzle/db"

// Payments as the admin sees them: every purchase, and one purchase in full.

export const PAYMENTS_PAGE_SIZE = 50
export const PAYMENT_STATUSES = ["all", "pending", "completed", "failed", "disputed", "refunded"] as const
export type PaymentStatusFilter = (typeof PAYMENT_STATUSES)[number]
export const PAYMENT_GATEWAYS = ["all", "esewa", "khalti", "fonepay", "bank", "free"] as const
export type PaymentGatewayFilter = (typeof PAYMENT_GATEWAYS)[number]

type Row = Record<string, unknown>
const rows = async (query: ReturnType<typeof sql>) => (await db.execute(query)).rows as Row[]
const date = (v: unknown) => (v == null ? null : new Date(String(v)))

export async function listPayments({
  q,
  status,
  gateway,
  page,
}: {
  q?: string
  status: PaymentStatusFilter
  gateway: PaymentGatewayFilter
  page: number
}) {
  const term = q?.trim() || null
  const result = await rows(sql`
    select p.id, p.status, p.gateway, p."pricePaidInPaisa" as paisa, p."createdAt" as created_at,
      p."productDetails"->>'name' as product, p."gatewayCheckoutId" as checkout_id, p."gatewayTransactionId" as transaction_id,
      u.id as user_id, u.name as buyer, u.email as buyer_email,
      (select e.outcome::text || coalesce(' · ' || e."gatewayStatus", '') from payment_events e where e."purchaseId" = p.id order by e."createdAt" desc limit 1) as last_event
    from purchases p join "user" u on u.id = p."userId"
    where ${status === "all" ? sql`true` : sql`p.status = ${status}`}
      and ${gateway === "all" ? sql`true` : sql`p.gateway = ${gateway}`}
      and ${
        term
          ? sql`(u.email ilike ${`%${term}%`} or u.name ilike ${`%${term}%`} or p."productDetails"->>'name' ilike ${`%${term}%`}
                 or p.id::text = ${term} or p."gatewayCheckoutId" = ${term} or p."gatewayTransactionId" = ${term})`
          : sql`true`
      }
    order by p."createdAt" desc
    limit ${PAYMENTS_PAGE_SIZE + 1} offset ${(page - 1) * PAYMENTS_PAGE_SIZE}
  `)
  return {
    rows: result.slice(0, PAYMENTS_PAGE_SIZE).map((r) => ({
      id: String(r.id),
      status: String(r.status),
      gateway: String(r.gateway),
      paisa: Number(r.paisa),
      createdAt: new Date(String(r.created_at)),
      product: String(r.product ?? "—"),
      checkoutId: String(r.checkout_id),
      transactionId: r.transaction_id == null ? null : String(r.transaction_id),
      userId: String(r.user_id),
      buyer: String(r.buyer),
      buyerEmail: String(r.buyer_email),
      lastEvent: r.last_event == null ? null : String(r.last_event),
    })),
    hasMore: result.length > PAYMENTS_PAGE_SIZE,
  }
}

/** Counts per status, and the money taken in the last 30 days. */
export async function getPaymentSummary() {
  const [r] = await rows(sql`
    select
      count(*) as all_count,
      count(*) filter (where status = 'pending') as pending,
      count(*) filter (where status = 'completed') as completed,
      count(*) filter (where status = 'failed') as failed,
      count(*) filter (where status = 'disputed') as disputed,
      count(*) filter (where status = 'refunded') as refunded,
      count(*) filter (where status = 'pending' and gateway <> 'free' and "createdAt" < now() - interval '1 hour') as stuck,
      coalesce(sum("pricePaidInPaisa") filter (where status = 'completed' and "createdAt" > now() - interval '30 days'), 0) as taken_30d,
      count(*) filter (where status = 'completed' and gateway <> 'free' and "createdAt" > now() - interval '30 days') as paid_30d,
      count(*) filter (where status = 'failed' and "createdAt" > now() - interval '30 days') as failed_30d
    from purchases
  `)
  return {
    counts: {
      all: Number(r!.all_count),
      pending: Number(r!.pending),
      completed: Number(r!.completed),
      failed: Number(r!.failed),
      disputed: Number(r!.disputed),
      refunded: Number(r!.refunded),
    } satisfies Record<PaymentStatusFilter, number>,
    stuck: Number(r!.stuck),
    taken30dPaisa: Number(r!.taken_30d),
    paid30d: Number(r!.paid_30d),
    failed30d: Number(r!.failed_30d),
  }
}

/** One purchase with everything that happened to it. Null if there's no such purchase. */
export async function getPaymentDetail(purchaseId: string) {
  const [purchase] = await rows(sql`
    select p.*, u.name as buyer, u.email as buyer_email, u.deleted_at as buyer_deleted,
      d.code as discount_code, ru.name as referred_by, pr.status as product_status
    from purchases p
    join "user" u on u.id = p."userId"
    left join discount_codes d on d.id = p.discount_code_id
    left join "user" ru on ru.id = p."referredByInstructorId"
    left join products pr on pr.id = p."productId"
    where p.id = ${purchaseId}
  `)
  if (purchase == null) return null

  const [events, ledger, invoices, refunds] = await Promise.all([
    rows(sql`select id, source, outcome, "gatewayStatus" as gateway_status, "amountInPaisa" as paisa, detail, "createdAt" as created_at
             from payment_events where "purchaseId" = ${purchaseId} order by "createdAt"`),
    rows(sql`select l.id, l."entryType" as entry_type, l."revenueSource" as source, l."platformFeeRateBps" as fee_bps,
               l."grossAmountPaisa" as gross, l."platformFeePaisa" as fee, l."creatorEarningsPaisa" as earnings, l."createdAt" as created_at,
               c.name as course, u.id as creator_id, u.name as creator
             from ledger_entries l join courses c on c.id = l."courseId" join "user" u on u.id = l."instructorId"
             where l."purchaseId" = ${purchaseId} order by l."createdAt", c.name`),
    rows(sql`select id, "invoiceNumber" as number, status, "totalPaisa" as total, "pdfR2Key" as pdf_key, "emailedAt" as emailed_at,
               delivery_attempts, last_delivery_error, "createdAt" as created_at
             from invoices where "purchaseId" = ${purchaseId}`),
    rows(sql`select id, status, reason, "completionPercentAtRequest" as completion, "withinWindowAtRequest" as within_window,
               eligible, "adminNote" as admin_note, "reviewedAt" as reviewed_at, "createdAt" as created_at
             from refund_requests where "purchaseId" = ${purchaseId} order by "createdAt"`),
  ])

  const details = (purchase.productDetails ?? {}) as { name?: string; description?: string; imageUrl?: string }
  const invoice = invoices[0]
  return {
    id: String(purchase.id),
    status: String(purchase.status),
    gateway: String(purchase.gateway),
    paisa: Number(purchase.pricePaidInPaisa),
    discountPaisa: Number(purchase.discount_amount_paisa ?? 0),
    discountCode: purchase.discount_code == null ? null : String(purchase.discount_code),
    referredBy: purchase.referred_by == null ? null : { id: String(purchase.referredByInstructorId), name: String(purchase.referred_by) },
    productId: String(purchase.productId),
    productName: details.name ?? "—",
    productStatus: purchase.product_status == null ? null : String(purchase.product_status),
    userId: String(purchase.userId),
    buyer: String(purchase.buyer),
    buyerEmail: String(purchase.buyer_email),
    buyerDeleted: purchase.buyer_deleted != null,
    checkoutId: String(purchase.gatewayCheckoutId),
    transactionId: purchase.gatewayTransactionId == null ? null : String(purchase.gatewayTransactionId),
    rawGatewayResponse: purchase.rawGatewayResponse ?? null,
    expiresAt: date(purchase.expiresAt),
    refundedAt: date(purchase.refundedAt),
    refundReason: purchase.refundReason == null ? null : String(purchase.refundReason),
    createdAt: new Date(String(purchase.createdAt)),
    updatedAt: new Date(String(purchase.updatedAt)),
    events: events.map((e) => ({
      id: String(e.id),
      source: String(e.source),
      outcome: String(e.outcome),
      gatewayStatus: e.gateway_status == null ? null : String(e.gateway_status),
      paisa: e.paisa == null ? null : Number(e.paisa),
      detail: e.detail ?? null,
      createdAt: new Date(String(e.created_at)),
    })),
    ledger: ledger.map((l) => ({
      id: String(l.id),
      entryType: String(l.entry_type) as "sale" | "refund",
      source: String(l.source),
      feeBps: Number(l.fee_bps),
      grossPaisa: Number(l.gross),
      feePaisa: Number(l.fee),
      earningsPaisa: Number(l.earnings),
      createdAt: new Date(String(l.created_at)),
      course: String(l.course),
      creatorId: String(l.creator_id),
      creator: String(l.creator),
    })),
    invoice:
      invoice == null
        ? null
        : {
            id: String(invoice.id),
            number: String(invoice.number),
            status: String(invoice.status),
            totalPaisa: Number(invoice.total),
            pdfKey: invoice.pdf_key == null ? null : String(invoice.pdf_key),
            emailedAt: date(invoice.emailed_at),
            attempts: Number(invoice.delivery_attempts),
            lastError: invoice.last_delivery_error == null ? null : String(invoice.last_delivery_error),
          },
    refunds: refunds.map((r) => ({
      id: String(r.id),
      status: String(r.status),
      reason: r.reason == null ? null : String(r.reason),
      completion: Number(r.completion),
      withinWindow: Boolean(r.within_window),
      eligible: Boolean(r.eligible),
      adminNote: r.admin_note == null ? null : String(r.admin_note),
      reviewedAt: date(r.reviewed_at),
      createdAt: new Date(String(r.created_at)),
    })),
  }
}
