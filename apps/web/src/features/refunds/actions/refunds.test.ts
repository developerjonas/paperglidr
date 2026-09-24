import { eq } from "drizzle-orm"
import { describe, expect, it, vi } from "vitest"
import { db } from "@/drizzle/db"
import { RefundRequestCourseTable, RefundRequestTable } from "@/drizzle/schema"
import { createCompletedPurchase } from "@/test/fixtures"

// A refund request records every course it covers — all of a bundle's.

const session = vi.hoisted(() => ({ userId: null as string | null }))
vi.mock("@/lib/auth", () => ({
  auth: { api: { getSession: async () => (session.userId ? { user: { id: session.userId } } : null) } },
}))
vi.mock("next/headers", () => ({ headers: async () => new Headers(), cookies: async () => ({ get: () => undefined }) }))

const { requestRefund } = await import("./refunds")

const coursesOf = async (purchaseId: string) => {
  const [request] = await db.select().from(RefundRequestTable).where(eq(RefundRequestTable.purchaseId, purchaseId))
  const rows = await db
    .select({ courseId: RefundRequestCourseTable.courseId })
    .from(RefundRequestCourseTable)
    .where(eq(RefundRequestCourseTable.refundRequestId, request!.id))
  return rows.map(r => r.courseId).sort()
}

describe("refund request courses", () => {
  it("a bundle's request stores all of its courses", async () => {
    const { purchase, buyer, courseIds } = await createCompletedPurchase({ courses: 3 })
    session.userId = buyer.id
    expect(await requestRefund(purchase.id, "not for me")).toMatchObject({ error: false })
    expect(await coursesOf(purchase.id)).toEqual([...courseIds].sort())
  })

  it("a single-course request stores that course; a duplicate request writes nothing", async () => {
    const { purchase, buyer, courseIds } = await createCompletedPurchase()
    session.userId = buyer.id
    await requestRefund(purchase.id)
    expect(await requestRefund(purchase.id)).toMatchObject({ error: true })
    expect(await coursesOf(purchase.id)).toEqual(courseIds)
    const all = await db.select().from(RefundRequestTable).where(eq(RefundRequestTable.purchaseId, purchase.id))
    expect(all).toHaveLength(1)
  })
})
