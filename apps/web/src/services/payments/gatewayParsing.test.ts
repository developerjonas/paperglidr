import crypto from "node:crypto"
import { afterEach, describe, expect, it, vi } from "vitest"
import { SANDBOX_DEFAULTS, type EsewaConfig } from "./config"
import { signEsewaFields } from "./esewa/esewaClient"
import { decodeEsewaResponse, verifyEsewaTransaction } from "./esewa/esewaServer"
import { verifyKhaltiTransaction } from "./khalti/khaltiServer"
import { rupeesToPaisa } from "./types"

const esewa: EsewaConfig = { ...SANDBOX_DEFAULTS.esewa }
const uuid = "00000000-0000-4000-8000-0000000000aa"

afterEach(() => vi.restoreAllMocks())

describe("rupeesToPaisa", () => {
  it.each([
    [999.0, 99900], // eSewa sandbox status API returns a number
    ["100.00", 10000],
    ["1,000.0", 100000], // comma-grouped
    ["100.5", 10050],
  ])("%s -> %s paisa", (input, expected) => {
    expect(rupeesToPaisa(input)).toBe(expected)
  })

  it.each([["abc"], [""], [null], ["100.005"], ["-5"], [{}]])("rejects %s", input => {
    expect(rupeesToPaisa(input)).toBeNull()
  })
})

describe("decodeEsewaResponse (success_url ?data=)", () => {
  function encode(payload: Record<string, string>, secret = esewa.secretKey) {
    const names = "transaction_code,status,total_amount,transaction_uuid,product_code,signed_field_names"
    const fields = { ...payload, signed_field_names: names }
    const signature = signEsewaFields(fields, names.split(","), secret)
    return Buffer.from(JSON.stringify({ ...fields, signature })).toString("base64")
  }
  const payload = {
    transaction_code: "000AWEO",
    status: "COMPLETE",
    total_amount: "1,000.0",
    transaction_uuid: uuid,
    product_code: "EPAYTEST",
  }

  it("accepts a correctly signed payload", () => {
    expect(decodeEsewaResponse(esewa, encode(payload))).toEqual({
      valid: true,
      transactionUuid: uuid,
      status: "COMPLETE",
      totalAmountInPaisa: 100000,
    })
  })

  it("rejects a payload signed with another key", () => {
    expect(decodeEsewaResponse(esewa, encode(payload, "attacker-key"))).toEqual({
      valid: false,
      reason: "bad signature",
    })
  })

  it("rejects a tampered amount", () => {
    const data = JSON.parse(Buffer.from(encode(payload), "base64").toString())
    data.total_amount = "1.0"
    expect(decodeEsewaResponse(esewa, Buffer.from(JSON.stringify(data)).toString("base64")).valid).toBe(false)
  })

  it("rejects garbage", () => {
    expect(decodeEsewaResponse(esewa, "%%%").valid).toBe(false)
  })
})

describe("verifyEsewaTransaction", () => {
  const respond = (body: unknown, status = 200) =>
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify(body), { status }))

  it("maps the real sandbox NOT_FOUND response", async () => {
    // Captured from rc.esewa.com.np for an unknown transaction.
    respond({ product_code: "EPAYTEST", transaction_uuid: uuid, total_amount: 999.0, status: "NOT_FOUND", ref_id: null })
    const result = await verifyEsewaTransaction(esewa, { transactionUuid: uuid, totalAmountInPaisa: 99900 })
    expect(result.status).toBe("not_found")
  })

  it("reports COMPLETE with the amount eSewa returned (not the one we asked about)", async () => {
    respond({ product_code: "EPAYTEST", transaction_uuid: uuid, total_amount: "1,000.0", status: "COMPLETE", ref_id: "R1" })
    const result = await verifyEsewaTransaction(esewa, { transactionUuid: uuid, totalAmountInPaisa: 99900 })
    expect(result).toMatchObject({ status: "completed", amountInPaisa: 100000, gatewayTransactionId: "R1" })
  })

  it.each([["CANCELED"], ["FULL_REFUND"], ["PARTIAL_REFUND"]])("%s is a terminal failure", async status => {
    respond({ product_code: "EPAYTEST", transaction_uuid: uuid, total_amount: 999, status, ref_id: null })
    expect((await verifyEsewaTransaction(esewa, { transactionUuid: uuid, totalAmountInPaisa: 99900 })).status).toBe("failed")
  })

  it("an answer about a different transaction is an error, not a result", async () => {
    respond({ product_code: "EPAYTEST", transaction_uuid: crypto.randomUUID(), total_amount: 999, status: "COMPLETE", ref_id: "R" })
    expect((await verifyEsewaTransaction(esewa, { transactionUuid: uuid, totalAmountInPaisa: 99900 })).status).toBe("error")
  })

  it("a 5xx is an error (state must not change), not a failure", async () => {
    respond({ message: "down" }, 503)
    expect((await verifyEsewaTransaction(esewa, { transactionUuid: uuid, totalAmountInPaisa: 99900 })).status).toBe("error")
  })
})

describe("verifyKhaltiTransaction", () => {
  const khalti = { secretKey: "k", baseUrl: SANDBOX_DEFAULTS.khalti.baseUrl }

  it("404 means Khalti has no such pidx", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response('{"detail":"Not found."}', { status: 404 }))
    expect((await verifyKhaltiTransaction(khalti, { pidx: "p" })).status).toBe("not_found")
  })

  it("reports the paisa amount Khalti returned", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ pidx: "p", total_amount: 1000, status: "Completed", transaction_id: "T" })),
    )
    expect(await verifyKhaltiTransaction(khalti, { pidx: "p" })).toMatchObject({
      status: "completed",
      amountInPaisa: 1000,
      gatewayTransactionId: "T",
    })
  })

  it.each([["Expired"], ["User canceled"], ["Refunded"]])("%s is a terminal failure", async status => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ pidx: "p", total_amount: 1000, status, transaction_id: null })),
    )
    expect((await verifyKhaltiTransaction(khalti, { pidx: "p" })).status).toBe("failed")
  })
})
