import { describe, expect, it } from "vitest"
import { createPendingPurchase, paisa, purchaseState } from "@/test/fixtures"
import { StubGateway, stubDeps } from "@/test/stubGateway"
import { NOT_FOUND_GRACE_MS, verifyAndFulfil } from "./verifyAndFulfil"
import { PENDING_EXPIRY_MS, reconcilePayments } from "./reconcilePayments"

const MINUTE = 60_000
const paid = (rupees: number, gatewayTransactionId?: string) => ({
  status: "completed" as const,
  amountInPaisa: paisa(rupees),
  gatewayTransactionId: gatewayTransactionId ?? `TXN-${crypto.randomUUID()}`,
})
// reconcilePayments looks at the whole (shared) test DB; the stub answers
// "pending" for everyone else's purchases, so a big limit keeps ours in.
const reconcile = (gateway: StubGateway, invoices?: string[]) =>
  reconcilePayments({ deps: stubDeps(gateway, invoices), limit: 10_000 })

function expectFulfilledOnce(state: Awaited<ReturnType<typeof purchaseState>>) {
  expect(state.status).toBe("completed")
  expect(state.ledgerEntries).toBe(1)
  expect(state.invoices).toBe(1)
  expect(state.accessRows).toBe(1)
  expect(state.events.filter(e => e.outcome === "completed")).toHaveLength(1)
}

describe("Invariant 1: completed exactly once, whatever the order and repetition", () => {
  it("return → poll → cron → return again → admin", async () => {
    const { purchase } = await createPendingPurchase({ priceInRupees: 999, ageMs: 5 * MINUTE })
    const gateway = new StubGateway().answer(purchase.id, paid(999))
    const invoices: string[] = []
    const deps = stubDeps(gateway, invoices)

    expect((await verifyAndFulfil(purchase.id, "return", deps)).outcome).toBe("completed")
    expect((await verifyAndFulfil(purchase.id, "poll", deps)).outcome).toBe("already_completed")
    await reconcile(gateway, invoices)
    expect((await verifyAndFulfil(purchase.id, "return", deps)).outcome).toBe("already_completed")
    expect((await verifyAndFulfil(purchase.id, "admin", deps)).outcome).toBe("already_completed")

    expectFulfilledOnce(await purchaseState(purchase.id))
    expect(invoices).toHaveLength(1)
    // Once completed, nobody asks the gateway again.
    expect(gateway.callsFor(purchase.id)).toBe(1)
  })

  it("cron first, then the late return route", async () => {
    const { purchase } = await createPendingPurchase({ ageMs: 5 * MINUTE })
    const gateway = new StubGateway().answer(purchase.id, paid(999))
    await reconcile(gateway)
    expect((await verifyAndFulfil(purchase.id, "return", stubDeps(gateway))).outcome).toBe("already_completed")
    expectFulfilledOnce(await purchaseState(purchase.id))
  })

  it("return route, poll, success page, admin and two cron runs all at the same time", async () => {
    const { purchase } = await createPendingPurchase({ ageMs: 5 * MINUTE })
    // Every call waits on the "gateway" at the same moment, then all race
    // into fulfilment together.
    const gateway = new StubGateway(100).answer(purchase.id, paid(999))
    const invoices: string[] = []
    const deps = stubDeps(gateway, invoices)

    const [direct, cronA, cronB] = await Promise.all([
      Promise.all([
        verifyAndFulfil(purchase.id, "return", deps),
        verifyAndFulfil(purchase.id, "return", deps),
        verifyAndFulfil(purchase.id, "poll", deps),
        verifyAndFulfil(purchase.id, "success_page", deps),
        verifyAndFulfil(purchase.id, "admin", deps),
      ]),
      reconcile(gateway, invoices),
      reconcile(gateway, invoices),
    ])

    // The five direct calls all asked the gateway while it was still
    // pending (the cron runs may arrive after completion and skip it)...
    expect(gateway.callsFor(purchase.id)).toBeGreaterThanOrEqual(5)
    // ...every caller saw a clean outcome (no spurious dispute/error)...
    for (const result of direct) {
      expect(["completed", "already_completed"]).toContain(result.outcome)
    }
    for (const summary of [cronA, cronB]) {
      expect(summary.outcomes.disputed ?? 0).toBe(0)
      expect(summary.outcomes.error ?? 0).toBe(0)
    }
    // ...and exactly one of them completed the purchase.
    const completions =
      direct.filter(r => r.outcome === "completed").length +
      (cronA.outcomes.completed ?? 0) +
      (cronB.outcomes.completed ?? 0)
    expect(completions).toBe(1)
    const state = await purchaseState(purchase.id)
    expectFulfilledOnce(state)
    expect(state.events.filter(e => e.outcome === "disputed" || e.outcome === "error")).toEqual([])
    expect(invoices).toHaveLength(1)
  })
})

describe("Invariant 2: access only for the exact amount in paisa; mismatch -> disputed", () => {
  it.each([
    ["one paisa short", paisa(999) - 1],
    ["more than the price", paisa(1999)],
    ["zero", 0],
    ["no amount reported", null],
  ])("%s -> disputed, no access", async (_label, amountInPaisa) => {
    const { purchase } = await createPendingPurchase({ priceInRupees: 999 })
    const gateway = new StubGateway().answer(purchase.id, {
      status: "completed",
      amountInPaisa,
      gatewayTransactionId: `TXN-${crypto.randomUUID()}`,
    })
    expect((await verifyAndFulfil(purchase.id, "return", stubDeps(gateway))).outcome).toBe("disputed")

    const state = await purchaseState(purchase.id)
    expect(state.status).toBe("disputed")
    expect(state.accessRows).toBe(0)
    expect(state.ledgerEntries).toBe(0)
    expect(state.invoices).toBe(0)
    expect(state.events.at(-1)?.outcome).toBe("disputed")
  })

  it("disputed is terminal for automated flows, even if the gateway later reports the right amount", async () => {
    const { purchase } = await createPendingPurchase({ priceInRupees: 999, ageMs: 5 * MINUTE })
    const gateway = new StubGateway().answer(purchase.id, { status: "completed", amountInPaisa: 1, gatewayTransactionId: "X" })
    await verifyAndFulfil(purchase.id, "return", stubDeps(gateway))

    gateway.answer(purchase.id, paid(999))
    expect((await verifyAndFulfil(purchase.id, "return", stubDeps(gateway))).outcome).toBe("skipped")
    await reconcile(gateway)
    const state = await purchaseState(purchase.id)
    expect(state.status).toBe("disputed")
    expect(state.accessRows).toBe(0)
  })

  it("one gateway transaction can't pay for two purchases", async () => {
    const first = await createPendingPurchase({ priceInRupees: 999 })
    const second = await createPendingPurchase({ priceInRupees: 999 })
    const txn = `TXN-${crypto.randomUUID()}`
    const gateway = new StubGateway().answer(first.purchase.id, paid(999, txn)).answer(second.purchase.id, paid(999, txn))

    expect((await verifyAndFulfil(first.purchase.id, "return", stubDeps(gateway))).outcome).toBe("completed")
    expect((await verifyAndFulfil(second.purchase.id, "return", stubDeps(gateway))).outcome).toBe("disputed")
    const state = await purchaseState(second.purchase.id)
    expect(state.status).toBe("disputed")
    expect(state.accessRows).toBe(0)
  })

  it("the expected amount sent to the gateway comes from the purchase row", async () => {
    const { purchase } = await createPendingPurchase({ priceInRupees: 1234 })
    const gateway = new StubGateway()
    await verifyAndFulfil(purchase.id, "return", stubDeps(gateway))
    expect(gateway.calls[0]).toMatchObject({ purchaseId: purchase.id, expectedAmountInPaisa: 123400 })
  })
})

describe("Invariant 4: paid and closed the tab -> access within one cron run", () => {
  it("one reconcile run completes it", async () => {
    const { purchase } = await createPendingPurchase({ ageMs: 3 * MINUTE })
    const gateway = new StubGateway().answer(purchase.id, paid(999))
    // Nobody calls the return route. Just the cron:
    await reconcile(gateway)
    expectFulfilledOnce(await purchaseState(purchase.id))
  })

  it("leaves a purchase younger than 2 minutes to the return route", async () => {
    const { purchase } = await createPendingPurchase({ ageMs: 30_000 })
    const gateway = new StubGateway().answer(purchase.id, paid(999))
    await reconcile(gateway)
    expect(gateway.callsFor(purchase.id)).toBe(0)
    expect((await purchaseState(purchase.id)).status).toBe("pending")
  })
})

describe("Invariant 5: late success wins (failed -> completed)", () => {
  it("gateway said failed, later says paid", async () => {
    const { purchase } = await createPendingPurchase({ ageMs: 5 * MINUTE })
    const gateway = new StubGateway().answer(purchase.id, { status: "failed" })
    expect((await verifyAndFulfil(purchase.id, "return", stubDeps(gateway))).outcome).toBe("failed")
    expect((await purchaseState(purchase.id)).status).toBe("failed")
    expect((await purchaseState(purchase.id)).accessRows).toBe(0)

    gateway.answer(purchase.id, paid(999))
    expect((await verifyAndFulfil(purchase.id, "return", stubDeps(gateway))).outcome).toBe("completed")
    expectFulfilledOnce(await purchaseState(purchase.id))
  })

  it("not found stays pending during the grace period, fails after it, and the cron still picks up a late payment", async () => {
    const young = await createPendingPurchase({ ageMs: 5 * MINUTE })
    const old = await createPendingPurchase({ ageMs: NOT_FOUND_GRACE_MS + MINUTE })
    const gateway = new StubGateway()
      .answer(young.purchase.id, { status: "not_found" })
      .answer(old.purchase.id, { status: "not_found" })

    expect((await verifyAndFulfil(young.purchase.id, "cron", stubDeps(gateway))).outcome).toBe("pending")
    expect((await verifyAndFulfil(old.purchase.id, "cron", stubDeps(gateway))).outcome).toBe("failed")

    gateway.answer(old.purchase.id, paid(999))
    await reconcile(gateway) // failed purchases from the last 24h are re-checked
    expectFulfilledOnce(await purchaseState(old.purchase.id))
  })

  it("the cron expires a purchase pending for more than 48 hours, and a late payment still completes it", async () => {
    const { purchase } = await createPendingPurchase({ ageMs: PENDING_EXPIRY_MS + 60 * MINUTE })
    const gateway = new StubGateway().answer(purchase.id, { status: "pending" })
    await reconcile(gateway)
    const state = await purchaseState(purchase.id)
    expect(state.status).toBe("failed")
    expect(state.events.map(e => e.outcome)).toContain("expired")

    gateway.answer(purchase.id, paid(999))
    expect((await verifyAndFulfil(purchase.id, "admin", stubDeps(gateway))).outcome).toBe("completed")
    expectFulfilledOnce(await purchaseState(purchase.id))
  })

  it("a gateway error never changes state", async () => {
    const { purchase } = await createPendingPurchase({ ageMs: PENDING_EXPIRY_MS - MINUTE })
    const gateway = new StubGateway().answer(purchase.id, { status: "error" })
    expect((await verifyAndFulfil(purchase.id, "cron", stubDeps(gateway))).outcome).toBe("error")
    const state = await purchaseState(purchase.id)
    expect(state.status).toBe("pending")
    expect(state.events.at(-1)?.outcome).toBe("error")
  })
})
