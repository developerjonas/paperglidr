import { and, eq, sql } from "drizzle-orm"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { db } from "@/drizzle/db"
import {
  CourseSectionTable,
  LedgerEntryTable,
  LessonTable,
  PurchaseTable,
  RefundRequestTable,
  UserCourseAccessTable,
  UserLessonCompleteTable,
} from "@/drizzle/schema"
import { createCompletedPurchase, createUser } from "@/test/fixtures"

// Task 16: a refund approval revokes access and reverses the ledger exactly
// once, whatever order approvals and the admin revokeAccess arrive in.

const sent = vi.hoisted(() => [] as { to: string; subject: string }[])
vi.mock("@/services/email/resend", () => ({
  sendEmail: async (email: { to: string; subject: string }) => {
    sent.push(email)
  },
}))

const { approveRefundRequest, rejectRefundRequest } = await import("./reviewRefund")
const { revokePurchaseInTransaction } = await import("@/features/purchases/lib/revokePurchase")
const { getRefundEligibility } = await import("./eligibility")

async function openRequest(purchaseId: string, userId: string, courseId: string) {
  const [request] = await db
    .insert(RefundRequestTable)
    .values({
      purchaseId,
      userId,
      courseId,
      completionPercentAtRequest: 0,
      withinWindowAtRequest: true,
      eligible: true,
    })
    .returning()
  return request!
}

const count = async (where: ReturnType<typeof and>, table: typeof LedgerEntryTable | typeof UserCourseAccessTable) =>
  (await db.select({ n: sql<number>`count(*)::int` }).from(table).where(where))[0]!.n

beforeEach(() => {
  sent.length = 0
})

describe("refund approval", () => {
  it("revokes access, reverses the ledger once, records the admin, emails the buyer", async () => {
    const { purchase, buyer, courseIds } = await createCompletedPurchase({ courses: 2 })
    const admin = await createUser("admin")
    const request = await openRequest(purchase.id, buyer.id, courseIds[0]!)

    // Two admins click approve at the same moment.
    const results = await Promise.all([
      approveRefundRequest({ requestId: request.id, adminId: admin.id }),
      approveRefundRequest({ requestId: request.id, adminId: admin.id }),
    ])
    expect(results.map(r => r.outcome).sort()).toEqual(["already_reviewed", "approved"])

    const [after] = await db.select().from(PurchaseTable).where(eq(PurchaseTable.id, purchase.id))
    expect(after!.status).toBe("refunded")
    expect(after!.refundedAt).not.toBeNull()
    expect(await count(eq(UserCourseAccessTable.userId, buyer.id), UserCourseAccessTable)).toBe(0)

    const refundRows = await db
      .select()
      .from(LedgerEntryTable)
      .where(and(eq(LedgerEntryTable.purchaseId, purchase.id), eq(LedgerEntryTable.entryType, "refund")))
    expect(refundRows).toHaveLength(2) // one per course in the bundle
    const [net] = await db
      .select({ total: sql<number>`sum(${LedgerEntryTable.creatorEarningsPaisa})::int` })
      .from(LedgerEntryTable)
      .where(eq(LedgerEntryTable.purchaseId, purchase.id))
    expect(net!.total).toBe(0)

    const [reviewed] = await db.select().from(RefundRequestTable).where(eq(RefundRequestTable.id, request.id))
    expect(reviewed!.status).toBe("approved")
    expect(reviewed!.reviewedBy).toBe(admin.id)
    expect(reviewed!.reviewedAt).not.toBeNull()
    expect(sent).toHaveLength(1)
    expect(sent[0]!.to).toBe(buyer.email)

    // The admin revokeAccess path afterwards doesn't reverse again.
    const again = await db.transaction(trx => revokePurchaseInTransaction(trx, purchase.id))
    expect(again.outcome).toBe("already_refunded")
    expect(
      await count(and(eq(LedgerEntryTable.purchaseId, purchase.id), eq(LedgerEntryTable.entryType, "refund")), LedgerEntryTable),
    ).toBe(2)
  })

  it("approving after revokeAccess already refunded the purchase doesn't reverse twice", async () => {
    const { purchase, buyer, courseIds } = await createCompletedPurchase()
    const admin = await createUser("admin")
    const request = await openRequest(purchase.id, buyer.id, courseIds[0]!)
    await db.transaction(trx => revokePurchaseInTransaction(trx, purchase.id))
    const result = await approveRefundRequest({ requestId: request.id, adminId: admin.id })
    expect(result.outcome).toBe("approved")
    expect(
      await count(and(eq(LedgerEntryTable.purchaseId, purchase.id), eq(LedgerEntryTable.entryType, "refund")), LedgerEntryTable),
    ).toBe(1)
  })

  it("only one open request per purchase", async () => {
    const { purchase, buyer, courseIds } = await createCompletedPurchase()
    await openRequest(purchase.id, buyer.id, courseIds[0]!)
    await expect(openRequest(purchase.id, buyer.id, courseIds[0]!)).rejects.toThrow()
  })

  it("reject records the reason, keeps access, emails the buyer; a second decision is refused", async () => {
    const { purchase, buyer, courseIds } = await createCompletedPurchase()
    const admin = await createUser("admin")
    const request = await openRequest(purchase.id, buyer.id, courseIds[0]!)
    expect((await rejectRefundRequest({ requestId: request.id, adminId: admin.id, reason: "Completed offline" })).outcome).toBe("rejected")
    expect((await approveRefundRequest({ requestId: request.id, adminId: admin.id })).outcome).toBe("already_reviewed")
    const [reviewed] = await db.select().from(RefundRequestTable).where(eq(RefundRequestTable.id, request.id))
    expect(reviewed!.status).toBe("denied")
    expect(reviewed!.adminNote).toBe("Completed offline")
    expect(await count(eq(UserCourseAccessTable.userId, buyer.id), UserCourseAccessTable)).toBe(1)
    expect(sent.map(e => e.to)).toEqual([buyer.email])
  })
})

describe("refund eligibility", () => {
  async function addLessons(courseId: string, n: number) {
    const [section] = await db
      .insert(CourseSectionTable)
      .values({ name: "s", order: 0, courseId, status: "public" })
      .returning()
    return db
      .insert(LessonTable)
      .values(Array.from({ length: n }, (_, i) => ({ name: `l${i}`, order: i, status: "public" as const, sectionId: section!.id })))
      .returning()
  }

  it("aggregates completion across a bundle's courses", async () => {
    const { purchase, buyer, courseIds } = await createCompletedPurchase({ courses: 2 })
    const first = await addLessons(courseIds[0]!, 5)
    await addLessons(courseIds[1]!, 5)
    // 1 of 10 lessons done = 10%: eligible. The old code looked up the
    // product id as a course id and always saw 0%.
    await db.insert(UserLessonCompleteTable).values({ userId: buyer.id, lessonId: first[0]!.id })
    let eligibility = await getRefundEligibility(purchase.id)
    expect(eligibility.completionPercent).toBe(10)
    expect(eligibility.eligible).toBe(true)
    // 2 of 10 = 20%: not strictly under the threshold.
    await db.insert(UserLessonCompleteTable).values({ userId: buyer.id, lessonId: first[1]!.id })
    eligibility = await getRefundEligibility(purchase.id)
    expect(eligibility.completionPercent).toBe(20)
    expect(eligibility).toMatchObject({ eligible: false, reason: "completion_too_high" })
  })

  it("closes after the refund window and never applies to free or refunded purchases", async () => {
    const old = await createCompletedPurchase({ ageMs: 7 * 24 * 60 * 60 * 1000 + 60_000 })
    expect(await getRefundEligibility(old.purchase.id)).toMatchObject({ eligible: false, reason: "window_closed" })
    const free = await createCompletedPurchase({ priceInRupees: 0 })
    expect(await getRefundEligibility(free.purchase.id)).toMatchObject({ eligible: false, reason: "not_refundable" })
    const refunded = await createCompletedPurchase()
    await db.transaction(trx => revokePurchaseInTransaction(trx, refunded.purchase.id))
    expect(await getRefundEligibility(refunded.purchase.id)).toMatchObject({ eligible: false, reason: "not_refundable" })
  })
})
