import { eq } from "drizzle-orm"
import { describe, expect, it } from "vitest"
import { db } from "@/drizzle/db"
import { InstructorTable, PayoutTable } from "@/drizzle/schema"
import { createCompletedPurchase } from "@/test/fixtures"
import { UserFacingError } from "@/lib/safeError"
import { formatPayoutDetails } from "../schemas/payouts"
import { getInstructorBalances, MINIMUM_PAYOUT_PAISA, PAYOUT_HOLD_MS, requestPayout } from "./payouts"

// Task 17: earnings are withdrawable only after the refund window, a
// payout needs a verified phone, and concurrent requests can't spend the
// same balance twice.

const DAY = 24 * 60 * 60 * 1000
const details = { method: "esewa", walletId: "9800000000", accountName: "Creator" } as const

async function instructorProfile(userId: string, verified: boolean) {
  await db.insert(InstructorTable).values({
    userId,
    handle: `h${crypto.randomUUID().replaceAll("-", "").slice(0, 20)}`,
    name: "Creator",
    bio: "bio",
    profileImageUrl: "/x.png",
    phoneVerifiedAt: verified ? new Date() : null,
  })
}

const request = (instructorId: string, amountPaisa: number) =>
  requestPayout({ instructorId, amountPaisa, details, bankDetailsSnapshot: formatPayoutDetails(details) })

describe("payout hold", () => {
  it("fresh sales are on hold, not withdrawable", async () => {
    // NPR 5,000 sale an hour ago: creator share NPR 2,500 on hold.
    const { creator } = await createCompletedPurchase({ priceInRupees: 5000, ageMs: 60 * 60 * 1000 })
    await instructorProfile(creator.id, true)
    expect(await getInstructorBalances(creator.id)).toEqual({ available: 0, held: 250_000 })
    await expect(request(creator.id, MINIMUM_PAYOUT_PAISA)).rejects.toThrow("more than your available balance")
  })

  it("a sale becomes withdrawable once its refund window closes", async () => {
    const { creator } = await createCompletedPurchase({ priceInRupees: 5000, ageMs: PAYOUT_HOLD_MS + 60_000 })
    await instructorProfile(creator.id, true)
    expect(await getInstructorBalances(creator.id)).toEqual({ available: 250_000, held: 0 })
    const payout = await request(creator.id, 250_000)
    expect(payout.payoutMethod).toBe("esewa")
    expect(payout.payoutDetails).toEqual(details)
    expect(payout.bankDetailsSnapshot).toContain("Wallet ID: 9800000000")
    expect((await getInstructorBalances(creator.id)).available).toBe(0)
  })

  it("the hold uses the refund window: 1 minute short of it is still held", async () => {
    const { creator } = await createCompletedPurchase({ priceInRupees: 5000, ageMs: 7 * DAY - 60_000 })
    expect((await getInstructorBalances(creator.id)).held).toBe(250_000)
  })
})

describe("payout request safety", () => {
  it("concurrent requests for the whole balance: exactly one succeeds", async () => {
    const { creator } = await createCompletedPurchase({ priceInRupees: 5000, ageMs: 8 * DAY })
    await instructorProfile(creator.id, true)
    // Force the race: a blocker holds a lock that lets every request read
    // its balance but stops any of them inserting. Without the instructor
    // row lock, all five would then see the full balance and insert.
    const blocker = await db.$client.connect()
    await blocker.query("begin")
    await blocker.query("lock table payouts in share row exclusive mode")
    const pending = Array.from({ length: 5 }, () => request(creator.id, 250_000))
    await new Promise(resolve => setTimeout(resolve, 500))
    await blocker.query("commit")
    blocker.release()
    const results = await Promise.allSettled(pending)
    expect(results.filter(r => r.status === "fulfilled")).toHaveLength(1)
    for (const r of results.filter(r => r.status === "rejected")) {
      expect((r as PromiseRejectedResult).reason).toBeInstanceOf(UserFacingError)
    }
    const rows = await db.select().from(PayoutTable).where(eq(PayoutTable.instructorId, creator.id))
    expect(rows).toHaveLength(1)
    expect((await getInstructorBalances(creator.id)).available).toBe(0)
  })

  it("blocked without a verified phone, and without an instructor profile", async () => {
    const unverified = await createCompletedPurchase({ priceInRupees: 5000, ageMs: 8 * DAY })
    await instructorProfile(unverified.creator.id, false)
    await expect(request(unverified.creator.id, MINIMUM_PAYOUT_PAISA)).rejects.toThrow("Verify your phone number")

    const noProfile = await createCompletedPurchase({ priceInRupees: 5000, ageMs: 8 * DAY })
    await expect(request(noProfile.creator.id, MINIMUM_PAYOUT_PAISA)).rejects.toThrow("instructor profile")

    const rows = await db.select().from(PayoutTable).where(eq(PayoutTable.instructorId, unverified.creator.id))
    expect(rows).toHaveLength(0)
  })

  it("below the minimum is refused", async () => {
    const { creator } = await createCompletedPurchase({ priceInRupees: 5000, ageMs: 8 * DAY })
    await instructorProfile(creator.id, true)
    await expect(request(creator.id, MINIMUM_PAYOUT_PAISA - 1)).rejects.toThrow("Minimum payout")
  })
})
