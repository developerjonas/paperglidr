import { eq } from "drizzle-orm"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { db } from "@/drizzle/db"
import {
  CourseProductTable,
  DiscountCodeTable,
  ProductTable,
  PurchaseTable,
  UserCourseAccessTable,
} from "@/drizzle/schema"
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

describe("100%-discount enrollments respect the code's limits under concurrency", () => {
  async function productsBySameCreator(count: number) {
    const first = await createProduct({ priceInRupees: 999 })
    const products = [first.product]
    for (let i = 1; i < count; i++) {
      const [product] = await db
        .insert(ProductTable)
        .values({ name: `Extra ${crypto.randomUUID()}`, description: "d", imageUrl: "/x.png", priceInRupees: 999, status: "public", authorId: first.creator.id })
        .returning()
      await db.insert(CourseProductTable).values({ courseId: first.course.id, productId: product!.id })
      products.push(product!)
    }
    return { creator: first.creator, products }
  }
  async function freeCode(creatorId: string, limits: { maxRedemptions?: number; maxRedemptionsPerUser?: number }) {
    const code = `LIM${crypto.randomUUID().slice(0, 8)}`.toUpperCase()
    const [row] = await db
      .insert(DiscountCodeTable)
      .values({ code, creatorId, scopeType: "storewide", discountType: "percentage", amount: 100, ...limits })
      .returning()
    return row!
  }

  it("maxRedemptionsPerUser = 1: five parallel checkouts by one user -> exactly one free enrollment", async () => {
    const { creator, products } = await productsBySameCreator(5)
    const code = await freeCode(creator.id, { maxRedemptionsPerUser: 1 })
    const results = await Promise.all(
      products.map(product =>
        initiatePurchase({ productId: product.id, gateway: "esewa", idempotencyKey: key("esewa"), discountCode: code.code }),
      ),
    )
    const completed = (await purchasesOf(buyerId)).filter(p => p.status === "completed")
    expect(completed).toHaveLength(1)
    // The rest either saw the limit at checkout (full price, pending) or
    // hit the locked re-check (error) — none got in free.
    for (const result of results.filter(r => r.error)) {
      expect(result).toMatchObject({ message: "That code has reached its usage limit." })
    }
    const [row] = await db.select().from(DiscountCodeTable).where(eq(DiscountCodeTable.id, code.id))
    expect(row!.redemptionCount).toBe(1)
  })

  it("maxRedemptions = 2: five users enrolling in parallel -> exactly two", async () => {
    const { enrollFree } = await import("../lib/freeEnrollment")
    const { creator, products } = await productsBySameCreator(1)
    const code = await freeCode(creator.id, { maxRedemptions: 2 })
    const users = await Promise.all([1, 2, 3, 4, 5].map(() => createUser("rush")))
    const outcomes = await Promise.allSettled(
      users.map(user =>
        enrollFree({
          userId: user.id,
          product: products[0]!,
          idempotencyKey: key("esewa"),
          discount: { discountCodeId: code.id, discountAmountPaisa: 99900 },
        }),
      ),
    )
    expect(outcomes.filter(o => o.status === "fulfilled")).toHaveLength(2)
    const [row] = await db.select().from(DiscountCodeTable).where(eq(DiscountCodeTable.id, code.id))
    expect(row!.redemptionCount).toBe(2)
    // Rolled-back enrollments left no access behind.
    for (const [i, outcome] of outcomes.entries()) {
      const access = await db
        .select()
        .from(UserCourseAccessTable)
        .where(eq(UserCourseAccessTable.userId, users[i]!.id))
      expect(access).toHaveLength(outcome.status === "fulfilled" ? 1 : 0)
    }
  })
})
