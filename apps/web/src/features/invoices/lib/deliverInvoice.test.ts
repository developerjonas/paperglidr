import { eq } from "drizzle-orm"
import { describe, expect, it } from "vitest"
import { db } from "@/drizzle/db"
import { InvoiceTable } from "@/drizzle/schema"
import { createCompletedPurchase } from "@/test/fixtures"
import { createInvoiceForPurchase } from "../db/invoices"
import {
  deliverInvoice,
  INVOICE_DELIVERY_LEASE_MS,
  INVOICE_MAX_DELIVERY_ATTEMPTS,
  retryInvoiceDeliveries,
} from "./deliverInvoice"

// Invoice retry: the cron retries invoices whose PDF or email failed, at
// most INVOICE_MAX_DELIVERY_ATTEMPTS times, and never emails one twice.

async function invoice() {
  const { purchase, buyer } = await createCompletedPurchase()
  const created = await db.transaction(trx =>
    createInvoiceForPurchase(
      { purchase, buyer, lineItems: [{ description: "Course", amountPaisa: purchase.pricePaidInPaisa }] },
      trx,
    ),
  )
  return created.id
}

const state = async (id: string) => (await db.select().from(InvoiceTable).where(eq(InvoiceTable.id, id)))[0]!

/** A sender that fails `failures` times, then "emails" like the real one. */
function flakySender(failures: number) {
  const calls: string[] = []
  const send = async (id: string) => {
    calls.push(id)
    if (calls.filter(c => c === id).length <= failures) throw new Error("Resend 503")
    await db.update(InvoiceTable).set({ emailedAt: new Date() }).where(eq(InvoiceTable.id, id))
  }
  return { send, calls }
}

const later = (steps: number) => new Date(Date.now() + steps * (INVOICE_DELIVERY_LEASE_MS + 1000))

describe("invoice delivery retries", () => {
  it("a failed send is retried by the cron until it succeeds", async () => {
    const id = await invoice()
    const { send, calls } = flakySender(2)
    expect(await deliverInvoice(id, { send })).toBe("failed") // the post-payment attempt
    expect((await state(id)).lastDeliveryError).toBe("Resend 503")

    // Too soon: still inside the lease, the cron leaves it alone.
    expect(await deliverInvoice(id, { send })).toBe("skipped")

    await retryInvoiceDeliveries({ send, now: later(1), limit: 10_000 })
    await retryInvoiceDeliveries({ send, now: later(2), limit: 10_000 })
    const after = await state(id)
    expect(after.emailedAt).not.toBeNull()
    expect(after.deliveryAttempts).toBe(3)
    expect(calls.filter(c => c === id)).toHaveLength(3)

    // Delivered: never sent again.
    await retryInvoiceDeliveries({ send, now: later(3), limit: 10_000 })
    expect(calls.filter(c => c === id)).toHaveLength(3)
  })

  it(`gives up after ${INVOICE_MAX_DELIVERY_ATTEMPTS} attempts`, async () => {
    const id = await invoice()
    const { send, calls } = flakySender(100)
    for (let i = 0; i < INVOICE_MAX_DELIVERY_ATTEMPTS + 3; i++) {
      await deliverInvoice(id, { send, now: later(i) })
    }
    expect(calls).toHaveLength(INVOICE_MAX_DELIVERY_ATTEMPTS)
    const after = await state(id)
    expect(after.deliveryAttempts).toBe(INVOICE_MAX_DELIVERY_ATTEMPTS)
    expect(after.emailedAt).toBeNull()
  })

  it("two senders at the same moment: only one sends", async () => {
    const id = await invoice()
    const { send, calls } = flakySender(0)
    const results = await Promise.all([deliverInvoice(id, { send }), deliverInvoice(id, { send })])
    expect(results.sort()).toEqual(["sent", "skipped"])
    expect(calls).toHaveLength(1)
  })

  it("a void invoice is never sent", async () => {
    const id = await invoice()
    await db.update(InvoiceTable).set({ status: "void" }).where(eq(InvoiceTable.id, id))
    const { send, calls } = flakySender(0)
    expect(await deliverInvoice(id, { send })).toBe("skipped")
    expect(calls).toHaveLength(0)
  })
})
