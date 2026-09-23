import { afterEach, describe, expect, it, vi } from "vitest"
import {
  PaymentConfigError,
  resolvePaymentConfig,
  SANDBOX_DEFAULTS,
  type PaymentEnv,
} from "./config"
import { createEsewaGateway } from "./esewa/esewaServer"
import { createKhaltiGateway } from "./khalti/khaltiServer"

// Invariant 3: live mode never touches a sandbox URL or test merchant
// code. A missing live var disables that gateway; it never falls back.

const LIVE_ESEWA: PaymentEnv = {
  ESEWA_PRODUCT_CODE: "LIVEMERCHANT",
  ESEWA_SECRET_KEY: "live-secret",
  ESEWA_FORM_URL: "https://epay.esewa.com.np/api/epay/main/v2/form",
  ESEWA_STATUS_URL: "https://epay.esewa.com.np/api/epay/transaction/status/",
}
const LIVE_KHALTI: PaymentEnv = {
  KHALTI_SECRET_KEY: "live-khalti-key",
  KHALTI_BASE_URL: "https://khalti.com/api/v2",
}
const SANDBOX_HOSTS = ["rc-epay.esewa.com.np", "rc.esewa.com.np", "dev.khalti.com", "dev-clientapi.fonepay.com"]

describe("resolvePaymentConfig — live mode (invariant 3)", () => {
  it("uses no defaults: with nothing set, every gateway is disabled", () => {
    const config = resolvePaymentConfig({ PAYMENT_MODE: "live" })
    expect(config.esewa).toBeNull()
    expect(config.khalti).toBeNull()
    expect(config.fonepay).toBeNull()
    expect(config.disabledReasons.esewa).toMatch(/missing ESEWA_PRODUCT_CODE/)
  })

  it("uses exactly the live values when all are set", () => {
    const config = resolvePaymentConfig({ PAYMENT_MODE: "live", ...LIVE_ESEWA, ...LIVE_KHALTI })
    expect(config.esewa).toEqual({
      productCode: "LIVEMERCHANT",
      secretKey: "live-secret",
      formUrl: LIVE_ESEWA.ESEWA_FORM_URL,
      statusUrl: LIVE_ESEWA.ESEWA_STATUS_URL,
    })
    expect(config.khalti).toEqual({ secretKey: "live-khalti-key", baseUrl: "https://khalti.com/api/v2" })
  })

  it.each(Object.keys(LIVE_ESEWA))("disables eSewa (no fallback) when %s is missing", missingKey => {
    const env: PaymentEnv = { PAYMENT_MODE: "live", ...LIVE_ESEWA, [missingKey]: undefined }
    const config = resolvePaymentConfig(env)
    expect(config.esewa).toBeNull()
    expect(config.disabledReasons.esewa).toContain(missingKey)
  })

  it("treats an empty string as missing", () => {
    const config = resolvePaymentConfig({ PAYMENT_MODE: "live", ...LIVE_ESEWA, ESEWA_SECRET_KEY: "  " })
    expect(config.esewa).toBeNull()
  })

  it("disables Khalti when its base URL is missing instead of using the dev URL", () => {
    const config = resolvePaymentConfig({ PAYMENT_MODE: "live", KHALTI_SECRET_KEY: "live-khalti-key" })
    expect(config.khalti).toBeNull()
  })

  it.each([
    ["ESEWA_FORM_URL", SANDBOX_DEFAULTS.esewa.formUrl],
    ["ESEWA_STATUS_URL", SANDBOX_DEFAULTS.esewa.statusUrl],
    ["ESEWA_PRODUCT_CODE", "EPAYTEST"],
    ["ESEWA_SECRET_KEY", SANDBOX_DEFAULTS.esewa.secretKey],
  ])("refuses to start when %s is a sandbox value", (key, value) => {
    expect(() => resolvePaymentConfig({ PAYMENT_MODE: "live", ...LIVE_ESEWA, [key]: value })).toThrow(
      PaymentConfigError,
    )
  })

  it("refuses a sandbox Khalti or Fonepay URL even when that gateway would otherwise be disabled", () => {
    expect(() =>
      resolvePaymentConfig({ PAYMENT_MODE: "live", KHALTI_BASE_URL: "https://dev.khalti.com/api/v2" }),
    ).toThrow(PaymentConfigError)
    expect(() =>
      resolvePaymentConfig({ PAYMENT_MODE: "live", FONEPAY_BASE_URL: SANDBOX_DEFAULTS.fonepay.baseUrl }),
    ).toThrow(PaymentConfigError)
  })

  it("requires https for live URLs", () => {
    expect(() =>
      resolvePaymentConfig({
        PAYMENT_MODE: "live",
        ...LIVE_ESEWA,
        ESEWA_STATUS_URL: "http://epay.esewa.com.np/api/epay/transaction/status/",
      }),
    ).toThrow(/https/)
  })

  it("requires PAYMENT_MODE to be set explicitly", () => {
    expect(() => resolvePaymentConfig({})).toThrow(PaymentConfigError)
    expect(() => resolvePaymentConfig({ PAYMENT_MODE: "production" })).toThrow(PaymentConfigError)
  })
})

describe("resolvePaymentConfig — sandbox mode", () => {
  it("enables eSewa from SANDBOX_DEFAULTS with nothing set; Khalti and Fonepay stay off", () => {
    const config = resolvePaymentConfig({ PAYMENT_MODE: "sandbox" })
    expect(config.esewa).toEqual({
      productCode: "EPAYTEST",
      secretKey: SANDBOX_DEFAULTS.esewa.secretKey,
      formUrl: SANDBOX_DEFAULTS.esewa.formUrl,
      statusUrl: SANDBOX_DEFAULTS.esewa.statusUrl,
    })
    expect(config.khalti).toBeNull()
    expect(config.fonepay).toBeNull()
  })

  it("enables Khalti against the dev URL once a test key is set", () => {
    const config = resolvePaymentConfig({ PAYMENT_MODE: "sandbox", KHALTI_SECRET_KEY: "test-key" })
    expect(config.khalti).toEqual({ secretKey: "test-key", baseUrl: SANDBOX_DEFAULTS.khalti.baseUrl })
  })
})

describe("PAYMENT_ENABLED_GATEWAYS", () => {
  it("can only switch configured gateways off", () => {
    const config = resolvePaymentConfig({
      PAYMENT_MODE: "sandbox",
      PAYMENT_ENABLED_GATEWAYS: "khalti,fonepay",
    })
    expect(config.esewa).toBeNull()
    expect(config.disabledReasons.esewa).toMatch(/PAYMENT_ENABLED_GATEWAYS/)
    expect(config.khalti).toBeNull() // listed, but not configured
  })

  it("rejects unknown gateway names", () => {
    expect(() =>
      resolvePaymentConfig({ PAYMENT_MODE: "sandbox", PAYMENT_ENABLED_GATEWAYS: "esewa,stub" }),
    ).toThrow(PaymentConfigError)
  })
})

describe("live gateways only call their configured live URLs (invariant 3)", () => {
  afterEach(() => vi.restoreAllMocks())

  it("eSewa: form URL and status API", async () => {
    const config = resolvePaymentConfig({ PAYMENT_MODE: "live", ...LIVE_ESEWA })
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          product_code: "LIVEMERCHANT",
          transaction_uuid: "00000000-0000-4000-8000-000000000001",
          total_amount: 999.0,
          status: "COMPLETE",
          ref_id: "REF1",
        }),
      ),
    )
    const gateway = createEsewaGateway(config.esewa!)

    const initiation = await gateway.initiate({
      purchaseId: "00000000-0000-4000-8000-000000000001",
      amountInPaisa: 99900,
      productName: "x",
      successUrl: "https://app.example/ok",
      failureUrl: "https://app.example/fail",
    })
    expect(initiation.type === "redirect" && initiation.url).toBe(LIVE_ESEWA.ESEWA_FORM_URL)
    expect(initiation.type === "redirect" && initiation.formFields?.product_code).toBe("LIVEMERCHANT")

    await gateway.verify({
      purchaseId: "00000000-0000-4000-8000-000000000001",
      gatewayCheckoutId: "00000000-0000-4000-8000-000000000001",
      expectedAmountInPaisa: 99900,
    })
    const calledUrls = fetchSpy.mock.calls.map(([url]) => String(url))
    expect(calledUrls).toHaveLength(1)
    expect(calledUrls[0]).toMatch(/^https:\/\/epay\.esewa\.com\.np\//)
    for (const host of SANDBOX_HOSTS) expect(calledUrls[0]).not.toContain(host)
  })

  it("Khalti: lookup API", async () => {
    const config = resolvePaymentConfig({ PAYMENT_MODE: "live", ...LIVE_KHALTI })
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ pidx: "p1", total_amount: 99900, status: "Completed", transaction_id: "T1" })),
    )
    await createKhaltiGateway(config.khalti!).verify({
      purchaseId: "x",
      gatewayCheckoutId: "p1",
      expectedAmountInPaisa: 99900,
    })
    const [url, init] = fetchSpy.mock.calls[0]!
    expect(String(url)).toBe("https://khalti.com/api/v2/epayment/lookup/")
    expect((init?.headers as Record<string, string>).Authorization).toBe("Key live-khalti-key")
  })
})
