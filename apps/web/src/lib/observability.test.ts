import { beforeEach, describe, expect, it, vi } from "vitest"
import type { ErrorEvent } from "@sentry/nextjs"
import { createPendingPurchase, paisa } from "@/test/fixtures"
import { StubGateway, stubDeps } from "@/test/stubGateway"

// Task 19: what reaches Sentry, and with which tags (the alert rules in
// docs/OBSERVABILITY.md filter on them).

const captured = vi.hoisted(() => ({
  exceptions: [] as { error: unknown; tags: Record<string, string> }[],
  messages: [] as { message: string; tags: Record<string, string> }[],
}))
vi.mock("@sentry/nextjs", () => ({
  captureException: (error: unknown, context: { tags: Record<string, string> }) => {
    captured.exceptions.push({ error, tags: context.tags })
  },
  captureMessage: (message: string, context: { tags: Record<string, string> }) => {
    captured.messages.push({ message, tags: context.tags })
  },
}))

const { safeErrorMessage, UserFacingError } = await import("./safeError")
const { scrubEvent } = await import("./sentryOptions")
const { verifyAndFulfil } = await import("@/features/purchases/lib/verifyAndFulfil")

beforeEach(() => {
  captured.exceptions.length = 0
  captured.messages.length = 0
})

describe("safeError reporting", () => {
  it("reports unexpected errors with their context, not user-facing ones", () => {
    vi.spyOn(console, "error").mockImplementation(() => {})
    safeErrorMessage(new UserFacingError("Minimum payout is NPR 1,000."), "requestPayout")
    expect(captured.exceptions).toHaveLength(0)
    safeErrorMessage(new Error("boom"), "requestPayout")
    expect(captured.exceptions).toHaveLength(1)
    expect(captured.exceptions[0]!.tags).toEqual({ area: "action", context: "requestPayout" })
  })
})

describe("scrubbing", () => {
  it("drops query params (e.g. bank details) and request cookies/headers", () => {
    const event = scrubEvent({
      type: undefined,
      exception: {
        values: [{ type: "DrizzleQueryError", value: 'Failed query: insert into "payouts" ...\nparams: 9800000000,Ram Bahadur' }],
      },
      request: { url: "https://paperglidr.com/x", cookies: { a: "b" }, headers: { cookie: "a=b" }, data: "x" },
    } as ErrorEvent)
    expect(event.exception!.values![0]!.value).toBe('Failed query: insert into "payouts" ...\nparams: [scrubbed]')
    expect(event.request).toEqual({ url: "https://paperglidr.com/x" })
  })
})

describe("payment verification reports", () => {
  it("amount mismatch, gateway error and a throwing verifier are tagged area=payments", async () => {
    const short = await createPendingPurchase({ priceInRupees: 999 })
    const noAnswer = await createPendingPurchase({ priceInRupees: 999 })
    const gateway = new StubGateway()
      .answer(short.purchase.id, { status: "completed", amountInPaisa: paisa(1), gatewayTransactionId: `T-${crypto.randomUUID()}` })
      .answer(noAnswer.purchase.id, { status: "error" })
    vi.spyOn(console, "error").mockImplementation(() => {})

    expect((await verifyAndFulfil(short.purchase.id, "return", stubDeps(gateway))).outcome).toBe("disputed")
    expect((await verifyAndFulfil(noAnswer.purchase.id, "cron", stubDeps(gateway))).outcome).toBe("error")

    const throwing = await createPendingPurchase({ priceInRupees: 999 })
    const deps = stubDeps(gateway)
    const broken = { ...deps, getVerifier: () => ({ verify: async () => { throw new Error("socket hang up") } }) }
    expect((await verifyAndFulfil(throwing.purchase.id, "poll", broken)).outcome).toBe("error")

    expect(captured.messages.map(m => m.tags)).toEqual([
      { area: "payments", payment_event: "amount_mismatch", gateway: "esewa", source: "return" },
      { area: "payments", payment_event: "gateway_error", gateway: "esewa", source: "cron" },
    ])
    expect(captured.exceptions.map(e => e.tags)).toEqual([
      { area: "payments", payment_event: "verify_error", gateway: "esewa", source: "poll" },
    ])
  })
})
