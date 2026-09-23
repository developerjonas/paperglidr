import { eq } from "drizzle-orm"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { db } from "@/drizzle/db"
import { DiscountCodeTable, PurchaseTable } from "@/drizzle/schema"
import { signEsewaFields } from "@/services/payments/esewa/esewaClient"
import { SANDBOX_DEFAULTS } from "@/services/payments/config"
import { createProduct, createUser, purchaseState } from "@/test/fixtures"

// Invariant 6: the client can't influence price, amount or gateway beyond
// picking from the enabled list. initiatePurchase is called directly with
// tampered input; only the session and cookie lookups are mocked.

const session = vi.hoisted(() => ({ userId: null as string | null }))
vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: async () => (session.userId ? { user: { id: session.userId } } : null),
    },
  },
}))
vi.mock("next/headers", () => ({
  headers: async () => new Headers(),
  cookies: async () => ({ get: () => undefined }),
}))

const { initiatePurchase } = await import("./purchases")

const key = (gateway: string) => `${crypto.randomUUID()}:${gateway}`
const purchasesOf = (userId: string) =>
  db.select().from(PurchaseTable).where(eq(PurchaseTable.userId, userId))

let buyerId: string
beforeEach(async () => {
  buyerId = (await createUser("buyer")).id
  session.userId = buyerId
})

describe("Invariant 6: the client picks a gateway from the enabled list — nothing else", () => {
  it("charges the server-side price, ignoring any amount fields the client adds", async () => {
    const { product } = await createProduct({ priceInRupees: 999 })
    const tampered = {
      productId: product.id,
      gateway: "esewa",
      idempotencyKey: key("esewa"),
      pricePaidInPaisa: 100,
      amountInPaisa: 100,
      priceInRupees: 1,
    } as unknown as Parameters<typeof initiatePurchase>[0]

    const result = await initiatePurchase(tampered)
    expect(result.error).toBe(false)
    const [purchase] = await purchasesOf(buyerId)
    expect(purchase!.pricePaidInPaisa).toBe(99900)

    // The signed eSewa form carries the server price, signed with the key.
    if (result.error || result.redirect == null) throw new Error("expected an eSewa redirect")
    const fields = result.redirect.formFields!
    expect(fields.total_amount).toBe("999.00")
    expect(fields.signature).toBe(
      signEsewaFields(fields, fields.signed_field_names!.split(","), SANDBOX_DEFAULTS.esewa.secretKey),
    )
  })

  it.each([
    ["free", "free"],
    ["a gateway that isn't enabled (fonepay)", "fonepay"],
    ["a gateway that isn't enabled (khalti, no key)", "khalti"],
    ["an unknown gateway", "stub"],
  ])("rejects %s", async (_label, gateway) => {
    const { product } = await createProduct({ priceInRupees: 999 })
    const result = await initiatePurchase({
      productId: product.id,
      gateway: gateway as "esewa",
      idempotencyKey: key(gateway),
    })
    expect(result.error).toBe(true)
    expect(await purchasesOf(buyerId)).toHaveLength(0)
  })

  it("rejects a checkout key minted for another gateway", async () => {
    const { product } = await createProduct()
    const result = await initiatePurchase({ productId: product.id, gateway: "esewa", idempotencyKey: key("khalti") })
    expect(result.error).toBe(true)
  })

  it("rejects a product that isn't public", async () => {
    const { product } = await createProduct({ status: "private" })
    const result = await initiatePurchase({ productId: product.id, gateway: "esewa", idempotencyKey: key("esewa") })
    expect(result.error).toBe(true)
    expect(await purchasesOf(buyerId)).toHaveLength(0)
  })

  it("ignores another creator's storewide code (full price)", async () => {
    const other = await createProduct()
    const { product } = await createProduct({ priceInRupees: 999 })
    const code = `SW${crypto.randomUUID().slice(0, 8)}`.toUpperCase()
    await db.insert(DiscountCodeTable).values({
      code,
      creatorId: other.creator.id,
      scopeType: "storewide",
      discountType: "percentage",
      amount: 100,
    })
    await initiatePurchase({ productId: product.id, gateway: "esewa", idempotencyKey: key("esewa"), discountCode: code })
    const [purchase] = await purchasesOf(buyerId)
    expect(purchase!.pricePaidInPaisa).toBe(99900)
    expect(purchase!.status).toBe("pending")
  })

  it("a 100% code from the product's own creator enrolls directly — no gateway, redemption recorded", async () => {
    const { product, creator } = await createProduct({ priceInRupees: 999 })
    const code = `FREE${crypto.randomUUID().slice(0, 8)}`.toUpperCase()
    await db.insert(DiscountCodeTable).values({
      code,
      creatorId: creator.id,
      scopeType: "storewide",
      discountType: "percentage",
      amount: 100,
    })
    const result = await initiatePurchase({
      productId: product.id,
      gateway: "esewa",
      idempotencyKey: key("esewa"),
      discountCode: code,
    })
    expect(result).toMatchObject({ error: false, redirect: { url: "/courses" } })
    const [purchase] = await purchasesOf(buyerId)
    expect(purchase).toMatchObject({ status: "completed", gateway: "free", pricePaidInPaisa: 0 })
    const state = await purchaseState(purchase!.id)
    expect(state.accessRows).toBe(1)
    expect(state.redemptions).toBe(1)
  })

  it("a retried click replays the same checkout; another user can't replay it", async () => {
    const { product } = await createProduct()
    const idempotencyKey = key("esewa")
    const first = await initiatePurchase({ productId: product.id, gateway: "esewa", idempotencyKey })
    const again = await initiatePurchase({ productId: product.id, gateway: "esewa", idempotencyKey })
    expect(again).toEqual(first)
    expect(await purchasesOf(buyerId)).toHaveLength(1)

    session.userId = (await createUser("intruder")).id
    const intruder = await initiatePurchase({ productId: product.id, gateway: "esewa", idempotencyKey })
    expect(intruder.error).toBe(true)
  })

  it("requires a signed-in user", async () => {
    session.userId = null
    const { product } = await createProduct()
    const result = await initiatePurchase({ productId: product.id, gateway: "esewa", idempotencyKey: key("esewa") })
    expect(result.error).toBe(true)
  })
})

describe("ownership means a completed purchase", () => {
  it("pending, failed, disputed and refunded attempts don't block checking out again", async () => {
    const { userOwnsProduct } = await import("@/features/products/db/products")
    const { product } = await createProduct()
    for (const status of ["pending", "failed", "disputed", "refunded"] as const) {
      const idempotencyKey = key("esewa")
      await db.insert(PurchaseTable).values({
        userId: buyerId,
        productId: product.id,
        productDetails: { name: "x", description: "d", imageUrl: "/x.png" },
        pricePaidInPaisa: 99900,
        gateway: "esewa",
        status,
        gatewayCheckoutId: idempotencyKey,
        idempotencyKey,
      })
      expect(await userOwnsProduct({ userId: buyerId, productId: product.id })).toBe(false)
    }
    await db.update(PurchaseTable).set({ status: "completed" }).where(eq(PurchaseTable.userId, buyerId))
    expect(await userOwnsProduct({ userId: buyerId, productId: product.id })).toBe(true)
  })
})
