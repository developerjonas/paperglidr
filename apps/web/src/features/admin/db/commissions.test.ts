import { describe, expect, it } from "vitest"
import { db } from "@/drizzle/db"
import { PayoutTable } from "@/drizzle/schema"
import { getInstructorBalances, PAYOUT_HOLD_MS } from "@/features/payouts/db/payouts"
import { createCompletedPurchase } from "@/test/fixtures"
import { getCreatorCommissions, getCreatorLedger } from "./commissions"

// Commissions per creator must agree with what the creator sees as their balance.

describe("admin commissions", () => {
  it("splits gross into fee and earnings, and matches the creator's own balance", async () => {
    const old = await createCompletedPurchase({ priceInRupees: 2000, ageMs: PAYOUT_HOLD_MS + 86_400_000 })
    const creatorId = old.creator.id
    await db.insert(PayoutTable).values({ instructorId: creatorId, amountPaisa: 50_000, status: "paid", bankDetailsSnapshot: "x", paidAt: new Date() })
    await db.insert(PayoutTable).values({ instructorId: creatorId, amountPaisa: 20_000, status: "requested", bankDetailsSnapshot: "x" })

    const [row] = await getCreatorCommissions({ period: "all", creatorId })
    const balances = await getInstructorBalances(creatorId)
    expect(row).toMatchObject({
      sales: 1,
      grossPaisa: 200_000,
      platformFeePaisa: 100_000,
      earningsPaisa: 100_000,
      paidOutPaisa: 50_000,
      requestedPaisa: 20_000,
      heldPaisa: balances.held,
      availablePaisa: balances.available,
    })
    expect(row!.availablePaisa).toBe(30_000)

    // The sale is 8 days old: inside the 30-day period, past the hold.
    expect((await getCreatorCommissions({ period: "30d", creatorId }))[0]).toMatchObject({ sales: 1, heldPaisa: 0 })
    expect(await getCreatorLedger(creatorId)).toHaveLength(1)
  })

  it("holds earnings from sales inside the refund window", async () => {
    const recent = await createCompletedPurchase({ priceInRupees: 1000 })
    const [row] = await getCreatorCommissions({ period: "30d", creatorId: recent.creator.id })
    expect(row).toMatchObject({ sales: 1, heldPaisa: 50_000, availablePaisa: 0 })
    expect(await getInstructorBalances(recent.creator.id)).toEqual({ held: 50_000, available: 0 })
  })
})
