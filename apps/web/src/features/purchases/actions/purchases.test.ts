import { eq } from "drizzle-orm"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { db } from "@/drizzle/db"
import {
  CourseProductTable,
  CourseTable,
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

// session.as(userId, fn) runs fn as that user, even when several calls
// overlap (AsyncLocalStorage); otherwise the shared session.userId is used.
const session = vi.hoisted(() => ({
  userId: null as string | null,
  current: undefined as undefined | (() => string | undefined),
  as: undefined as unknown as <T>(userId: string, fn: () => Promise<T>) => Promise<T>,
}))
vi.mock("@/lib/auth", async () => {
  const { AsyncLocalStorage } = await import("node:async_hooks")
  const store = new AsyncLocalStorage<string>()
  session.as = (userId, fn) => store.run(userId, fn)
  session.current = () => store.getStore()
  return {
    auth: {
      api: {
        getSession: async () => {
          const userId = session.current?.() ?? session.userId
          return userId ? { user: { id: userId } } : null
        },
      },
    },
  }
})
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
      // A course of its own, so owning one product doesn't own the others.
      const [course] = await db
        .insert(CourseTable)
        .values({ name: `Extra ${crypto.randomUUID()}`, description: "d", authorId: first.creator.id })
        .returning()
      await db.insert(CourseProductTable).values({ courseId: course!.id, productId: product!.id })
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

describe("buying something you already own", () => {
  it("is rejected after a completed purchase, and when course access already covers the product", async () => {
    const owned = await createProduct({ priceInRupees: 999 })
    await initiatePurchase({ productId: owned.product.id, gateway: "esewa", idempotencyKey: key("esewa") })
    await db.update(PurchaseTable).set({ status: "completed" }).where(eq(PurchaseTable.userId, buyerId))

    const again = await initiatePurchase({ productId: owned.product.id, gateway: "esewa", idempotencyKey: key("esewa") })
    expect(again).toMatchObject({ error: true, message: expect.stringContaining("already own") })

    // Access to every course in a product (e.g. from another bundle) counts too.
    const viaAccess = await createProduct({ priceInRupees: 999 })
    await db.insert(UserCourseAccessTable).values({ userId: buyerId, courseId: viaAccess.course.id })
    const viaAccessResult = await initiatePurchase({ productId: viaAccess.product.id, gateway: "esewa", idempotencyKey: key("esewa") })
    expect(viaAccessResult).toMatchObject({ error: true, message: expect.stringContaining("already own") })

    // Only the one pending purchase from the first checkout exists.
    expect(await purchasesOf(buyerId)).toHaveLength(1)
  })

  it("a refunded purchase doesn't count as owned", async () => {
    const { product } = await createProduct({ priceInRupees: 999 })
    const idempotencyKey = key("esewa")
    await db.insert(PurchaseTable).values({
      userId: buyerId,
      productId: product.id,
      productDetails: { name: "x", description: "d", imageUrl: "/x.png" },
      pricePaidInPaisa: 99900,
      gateway: "esewa",
      status: "refunded",
      refundedAt: new Date(),
      gatewayCheckoutId: idempotencyKey,
      idempotencyKey,
    })
    const result = await initiatePurchase({ productId: product.id, gateway: "esewa", idempotencyKey: key("esewa") })
    expect(result.error).toBe(false)
  })
})

describe("paid checkouts respect a discount's limits under concurrency", () => {
  it("maxRedemptions = 1: five users checking out at once -> one discounted checkout", async () => {
    const { product, creator } = await createProduct({ priceInRupees: 1000 })
    const code = `HALF${crypto.randomUUID().slice(0, 8)}`.toUpperCase()
    const [discount] = await db
      .insert(DiscountCodeTable)
      .values({ code, creatorId: creator.id, scopeType: "storewide", discountType: "percentage", amount: 50, maxRedemptions: 1 })
      .returning()
    const users = await Promise.all([1, 2, 3, 4, 5].map(() => createUser("rush")))

    // Force the race: a blocker lets every checkout validate the code and
    // count its uses, but stops any of them inserting its purchase. Without
    // the code row lock, all five would see 0 uses and get the discount.
    const blocker = await db.$client.connect()
    await blocker.query("begin")
    await blocker.query("lock table purchases in share row exclusive mode")
    const checkouts = users.map(user =>
      session.as(user.id, () =>
        initiatePurchase({ productId: product.id, gateway: "esewa", idempotencyKey: key("esewa"), discountCode: code }),
      ),
    )
    await new Promise(resolve => setTimeout(resolve, 500))
    await blocker.query("commit")
    blocker.release()
    const results = await Promise.all(checkouts)

    const withCode = await db.select().from(PurchaseTable).where(eq(PurchaseTable.discountCodeId, discount!.id))
    expect(withCode).toHaveLength(1)
    expect(users.map(u => u.id)).toContain(withCode[0]!.userId)
    expect(withCode[0]!.pricePaidInPaisa).toBe(50000)
    expect(results.filter(r => r.error)).toHaveLength(4)
    for (const result of results.filter(r => r.error)) {
      expect(result).toMatchObject({ message: "That code has reached its usage limit." })
    }
  })

  it("a pending checkout holds the use only for the reservation window", async () => {
    const { DISCOUNT_RESERVATION_MS } = await import("@/features/discounts/db/discounts")
    const { product, creator } = await createProduct({ priceInRupees: 1000 })
    const code = `ONE${crypto.randomUUID().slice(0, 8)}`.toUpperCase()
    const [discount] = await db
      .insert(DiscountCodeTable)
      .values({ code, creatorId: creator.id, scopeType: "storewide", discountType: "percentage", amount: 50, maxRedemptions: 1 })
      .returning()
    expect((await initiatePurchase({ productId: product.id, gateway: "esewa", idempotencyKey: key("esewa"), discountCode: code })).error).toBe(false)

    session.userId = (await createUser("second")).id
    const blocked = await initiatePurchase({ productId: product.id, gateway: "esewa", idempotencyKey: key("esewa"), discountCode: code })
    expect(blocked).toMatchObject({ error: true, message: "That code has reached its usage limit." })

    // The first buyer abandoned the checkout long ago: the use is free again.
    await db
      .update(PurchaseTable)
      .set({ createdAt: new Date(Date.now() - DISCOUNT_RESERVATION_MS - 60_000) })
      .where(eq(PurchaseTable.discountCodeId, discount!.id))
    const later = await initiatePurchase({ productId: product.id, gateway: "esewa", idempotencyKey: key("esewa"), discountCode: code })
    expect(later.error).toBe(false)
  })
})

const purchaseIdOf = (result: Awaited<ReturnType<typeof initiatePurchase>>) =>
  "purchaseId" in result ? result.purchaseId : undefined

describe("one pending checkout per buyer, product and gateway", () => {
  it("two checkouts at once -> one purchase; a later retry returns it", async () => {
    const { product } = await createProduct({ priceInRupees: 999 })
    // Force the race: both checkouts get past every read, then wait before
    // inserting. Without the per-buyer lock both would insert.
    const blocker = await db.$client.connect()
    await blocker.query("begin")
    await blocker.query("lock table purchases in share row exclusive mode")
    const attempts = [1, 2].map(() =>
      session.as(buyerId, () => initiatePurchase({ productId: product.id, gateway: "esewa", idempotencyKey: key("esewa") })),
    )
    await new Promise(resolve => setTimeout(resolve, 500))
    await blocker.query("commit")
    blocker.release()
    const results = await Promise.all(attempts)

    const rows = await purchasesOf(buyerId)
    expect(rows).toHaveLength(1)
    for (const result of results) {
      // Either the same checkout, or told to wait while it's being set up.
      if (result.error) expect(result.message).toContain("already starting")
      else expect(purchaseIdOf(result)).toBe(rows[0]!.id)
    }

    // A fresh click later (new checkout key) gets the same pending checkout.
    const again = await initiatePurchase({ productId: product.id, gateway: "esewa", idempotencyKey: key("esewa") })
    expect(again).toMatchObject({ error: false, purchaseId: rows[0]!.id })
    expect(await purchasesOf(buyerId)).toHaveLength(1)
  })

  it("an old pending checkout, or one at a different price, isn't reused", async () => {
    const { product, creator } = await createProduct({ priceInRupees: 1000 })
    await initiatePurchase({ productId: product.id, gateway: "esewa", idempotencyKey: key("esewa") })
    const [first] = await purchasesOf(buyerId)

    // Same product, now with a 50% code: a new checkout replaces the old one.
    const code = `SUP${crypto.randomUUID().slice(0, 8)}`.toUpperCase()
    await db.insert(DiscountCodeTable).values({ code, creatorId: creator.id, scopeType: "storewide", discountType: "percentage", amount: 50 })
    const discounted = await initiatePurchase({ productId: product.id, gateway: "esewa", idempotencyKey: key("esewa"), discountCode: code })
    expect(discounted.error).toBe(false)
    const discountedId = purchaseIdOf(discounted)
    expect(discountedId).not.toBe(first!.id)
    const rows = await purchasesOf(buyerId)
    expect(rows.find(r => r.id === first!.id)!.status).toBe("failed")
    expect(rows.find(r => r.id === discountedId)!.pricePaidInPaisa).toBe(50000)

    // Older than the reuse window: a new checkout.
    await db.update(PurchaseTable).set({ createdAt: new Date(Date.now() - 31 * 60 * 1000) }).where(eq(PurchaseTable.userId, buyerId))
    const later = await initiatePurchase({ productId: product.id, gateway: "esewa", idempotencyKey: key("esewa"), discountCode: code })
    expect(purchaseIdOf(later)).not.toBe(discountedId)
  })
})
