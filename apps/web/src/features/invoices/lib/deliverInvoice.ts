import "server-only"
import { and, asc, eq, gte, isNull, lt, or, sql } from "drizzle-orm"
import { db } from "@/drizzle/db"
import { InvoiceTable } from "@/drizzle/schema"
import { generateAndSendInvoice } from "../actions/generateAndSendInvoice"
import { captureError, captureEvent } from "@/lib/observability"

// After this many failed attempts the cron stops and Sentry is told
// (area=invoices, invoice_event=gave_up): someone has to look.
export const INVOICE_MAX_DELIVERY_ATTEMPTS = 5
// An attempt "owns" the invoice for this long: a second sender (the cron
// racing the post-payment send, or two cron runs) skips it instead of
// emailing twice. Also the minimum gap between retries.
export const INVOICE_DELIVERY_LEASE_MS = 10 * 60 * 1000

type Send = (invoiceId: string) => Promise<void>

const notLeased = (now: Date) =>
  or(
    isNull(InvoiceTable.lastDeliveryAttemptAt),
    lt(InvoiceTable.lastDeliveryAttemptAt, new Date(now.getTime() - INVOICE_DELIVERY_LEASE_MS)),
  )

/**
 * Claim the invoice for one delivery attempt: not yet emailed, not void,
 * under the attempt cap, and not attempted in the last lease period.
 * Atomic (one UPDATE … RETURNING), so only one caller wins.
 */
async function claim(invoiceId: string, now: Date) {
  const [claimed] = await db
    .update(InvoiceTable)
    .set({
      deliveryAttempts: sql`${InvoiceTable.deliveryAttempts} + 1`,
      lastDeliveryAttemptAt: now,
    })
    .where(
      and(
        eq(InvoiceTable.id, invoiceId),
        isNull(InvoiceTable.emailedAt),
        eq(InvoiceTable.status, "issued"),
        lt(InvoiceTable.deliveryAttempts, INVOICE_MAX_DELIVERY_ATTEMPTS),
        notLeased(now),
      ),
    )
    .returning({ attempts: InvoiceTable.deliveryAttempts })
  return claimed ?? null
}

/** One delivery attempt (PDF to R2 + email). Never throws. */
export async function deliverInvoice(
  invoiceId: string,
  { send = generateAndSendInvoice, now = new Date() }: { send?: Send; now?: Date } = {},
): Promise<"sent" | "skipped" | "failed"> {
  const claimed = await claim(invoiceId, now)
  if (claimed == null) return "skipped"
  try {
    await send(invoiceId)
    return "sent"
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    await db
      .update(InvoiceTable)
      .set({ lastDeliveryError: message.slice(0, 1000) })
      .where(eq(InvoiceTable.id, invoiceId))
    console.error(`[invoices] delivery attempt ${claimed.attempts} failed for invoice ${invoiceId}`, error)
    const gaveUp = claimed.attempts >= INVOICE_MAX_DELIVERY_ATTEMPTS
    captureError(
      error,
      { area: "invoices", invoice_event: gaveUp ? "gave_up" : "attempt_failed" },
      { invoiceId, attempt: claimed.attempts },
    )
    if (gaveUp) {
      captureEvent(
        "Invoice delivery gave up after the maximum attempts",
        { area: "invoices", invoice_event: "gave_up" },
        { extra: { invoiceId } },
      )
    }
    return "failed"
  }
}

/**
 * Cron step: retry invoices whose PDF or email failed. Oldest first; only
 * invoices from the last 30 days (older ones need a person anyway).
 */
export async function retryInvoiceDeliveries({
  now = new Date(),
  limit = 20,
  send,
}: { now?: Date; limit?: number; send?: Send } = {}) {
  const due = await db
    .select({ id: InvoiceTable.id })
    .from(InvoiceTable)
    .where(
      and(
        isNull(InvoiceTable.emailedAt),
        eq(InvoiceTable.status, "issued"),
        lt(InvoiceTable.deliveryAttempts, INVOICE_MAX_DELIVERY_ATTEMPTS),
        gte(InvoiceTable.createdAt, new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)),
        notLeased(now),
      ),
    )
    .orderBy(asc(InvoiceTable.createdAt))
    .limit(limit)

  const summary = { checked: due.length, sent: 0, failed: 0, skipped: 0 }
  for (const { id } of due) {
    summary[await deliverInvoice(id, { send, now })]++
  }
  return summary
}
