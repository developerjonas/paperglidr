import { describe, expect, it } from "vitest"
import { db } from "@/drizzle/db"
import { PaymentEventTable } from "@/drizzle/schema"
import { createCompletedPurchase, createPendingPurchase } from "@/test/fixtures"
import { getPaymentDetail, getPaymentSummary, listPayments } from "./payments"

// The admin payments list and one payment in full.

describe("admin payments", () => {
  it("filters by status and gateway, and finds a payment by its gateway ID", async () => {
    const { purchase: pending } = await createPendingPurchase({ gateway: "khalti", ageMs: 2 * 3_600_000 })
    const { purchase: done } = await createCompletedPurchase()

    const byCheckout = await listPayments({ q: pending.gatewayCheckoutId, status: "all", gateway: "all", page: 1 })
    expect(byCheckout.rows.map((r) => r.id)).toEqual([pending.id])
    expect((await listPayments({ q: pending.gatewayCheckoutId, status: "completed", gateway: "all", page: 1 })).rows).toHaveLength(0)
    expect((await listPayments({ q: pending.gatewayCheckoutId, status: "pending", gateway: "esewa", page: 1 })).rows).toHaveLength(0)
    expect((await listPayments({ q: done.gatewayTransactionId!, status: "completed", gateway: "esewa", page: 1 })).rows.map((r) => r.id)).toEqual([done.id])

    const summary = await getPaymentSummary()
    expect(summary.stuck).toBeGreaterThanOrEqual(1)
    expect(summary.counts.completed).toBeGreaterThanOrEqual(1)
  })

  it("shows the commission split, events and buyer for one payment", async () => {
    const { purchase, creator, buyer } = await createCompletedPurchase({ priceInRupees: 1000, courses: 2 })
    await db.insert(PaymentEventTable).values({
      purchaseId: purchase.id,
      source: "cron",
      gateway: "esewa",
      outcome: "completed",
      gatewayStatus: "COMPLETE",
      amountInPaisa: 100_000,
    })
    const detail = await getPaymentDetail(purchase.id)
    expect(detail).toMatchObject({ status: "completed", paisa: 100_000, userId: buyer.id, invoice: null, refunds: [] })
    expect(detail?.ledger).toHaveLength(2)
    expect(detail?.ledger.every((l) => l.creatorId === creator.id && l.entryType === "sale")).toBe(true)
    expect(detail?.ledger.reduce((n, l) => n + l.feePaisa + l.earningsPaisa, 0)).toBe(100_000)
    expect(detail?.events).toEqual([expect.objectContaining({ source: "cron", outcome: "completed", gatewayStatus: "COMPLETE", paisa: 100_000 })])
    expect(await getPaymentDetail("00000000-0000-0000-0000-000000000000")).toBeNull()
  })
})
