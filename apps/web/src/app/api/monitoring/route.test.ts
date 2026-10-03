import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { POST } from "./route"

// The browser error tunnel forwards only our own project's envelopes.

const DSN = "https://publickey123@app.glitchtip.com/28435"
const envelope = (dsn: string) => `${JSON.stringify({ dsn, sent_at: "2026-10-03T00:00:00Z" })}\n{"type":"event"}\n{"message":"x"}`
const post = (body: string) => POST(new Request("http://t/api/monitoring", { method: "POST", body }))

describe("POST /api/monitoring", () => {
  const fetchMock = vi.fn(async () => new Response(null, { status: 200 }))
  beforeEach(() => {
    process.env.NEXT_PUBLIC_SENTRY_DSN = DSN
    vi.stubGlobal("fetch", fetchMock)
    fetchMock.mockClear()
  })
  afterEach(() => {
    delete process.env.NEXT_PUBLIC_SENTRY_DSN
    vi.unstubAllGlobals()
  })

  it("forwards our project's envelope to its envelope endpoint", async () => {
    const res = await post(envelope(DSN))
    expect(res.status).toBe(200)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe("https://app.glitchtip.com/api/28435/envelope/?sentry_key=publickey123")
    expect(init.body).toBe(envelope(DSN))
  })

  it.each([
    ["another project", "https://publickey123@app.glitchtip.com/99999"],
    ["another host", "https://publickey123@evil.example/28435"],
    ["another key", "https://otherkey@app.glitchtip.com/28435"],
  ])("refuses %s (403) and sends nothing", async (_label, dsn) => {
    expect((await post(envelope(dsn))).status).toBe(403)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("refuses a malformed or oversized envelope", async () => {
    expect((await post("not json\n{}")).status).toBe(400)
    expect((await post("")).status).toBe(400)
    expect((await post(envelope(DSN) + "x".repeat(1_000_001))).status).toBe(400)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("is off (404) when no DSN is configured", async () => {
    delete process.env.NEXT_PUBLIC_SENTRY_DSN
    expect((await post(envelope(DSN))).status).toBe(404)
  })
})
