import { and, eq } from "drizzle-orm"
import { describe, expect, it, vi } from "vitest"
import { db } from "@/drizzle/db"
import { PurchaseTable, UserCourseAccessTable } from "@/drizzle/schema"
import { createProduct, createUser } from "@/test/fixtures"

// The app's "Enroll for free": free, live courses only; never a paid one.

process.env.MOBILE_API_ENABLED = "true"

const session = vi.hoisted(() => ({ userId: null as string | null }))
vi.mock("@/lib/auth", () => ({
  auth: { api: { getSession: async () => (session.userId ? { user: { id: session.userId } } : null) } },
}))
vi.mock("next/headers", () => ({ headers: async () => new Headers(), cookies: async () => ({ get: () => undefined }) }))

const { POST } = await import("./route")

const enroll = (productId: string, checkoutId: string = crypto.randomUUID()) =>
  POST(
    new Request(`http://t/api/v1/products/${productId}/enroll`, {
      method: "POST",
      body: JSON.stringify({ checkoutId }),
      headers: { "Content-Type": "application/json" },
    }) as never,
    { params: Promise.resolve({ productId }) } as never,
  )

const hasAccess = async (userId: string, courseId: string) =>
  (await db.select().from(UserCourseAccessTable).where(and(eq(UserCourseAccessTable.userId, userId), eq(UserCourseAccessTable.courseId, courseId)))).length > 0

describe("POST /api/v1/products/:id/enroll", () => {
  it("enrolls in a free course once, even on a double tap", async () => {
    const { product, course } = await createProduct({ priceInRupees: 0 })
    const learner = await createUser()
    session.userId = learner.id
    const checkoutId = crypto.randomUUID()

    const first = await enroll(product.id, checkoutId)
    expect(first.status).toBe(201)
    expect(await first.json()).toEqual({ enrolled: true, alreadyEnrolled: false })
    expect(await hasAccess(learner.id, course.id)).toBe(true)

    const again = await enroll(product.id, checkoutId)
    expect(await again.json()).toEqual({ enrolled: true, alreadyEnrolled: true })
    const purchases = await db.select().from(PurchaseTable).where(eq(PurchaseTable.userId, learner.id))
    expect(purchases).toEqual([expect.objectContaining({ gateway: "free", status: "completed", pricePaidInPaisa: 0 })])
  })

  it("refuses a paid course and grants nothing", async () => {
    const { product, course } = await createProduct({ priceInRupees: 999 })
    const learner = await createUser()
    session.userId = learner.id
    const res = await enroll(product.id)
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ message: "This course isn't free." })
    expect(await hasAccess(learner.id, course.id)).toBe(false)
  })

  it("404s for an unpublished course and 401s when signed out", async () => {
    const { product } = await createProduct({ priceInRupees: 0, status: "private" })
    session.userId = (await createUser()).id
    expect((await enroll(product.id)).status).toBe(404)
    session.userId = null
    expect((await enroll(product.id)).status).toBe(401)
  })
})
