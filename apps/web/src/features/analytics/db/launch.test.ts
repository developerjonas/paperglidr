import { eq } from "drizzle-orm"
import { describe, expect, it } from "vitest"
import { db } from "@/drizzle/db"
import { PurchaseTable } from "@/drizzle/schema"
import { createPendingPurchase, createUser } from "@/test/fixtures"
import { getCreatorSales, getLaunchDays, getLaunchSummary } from "./launch"

// The launch dashboard's numbers, measured as differences (the test
// database is shared, so absolute totals vary).

describe("launch dashboard", () => {
  it("counts sign-ups, paid sales, own-link sales, free enrollments and checkouts", async () => {
    const before = await getLaunchSummary(30)
    const daysBefore = await getLaunchDays(7)

    // One sale through the creator's own link, one pending, one failed.
    const own = await createPendingPurchase({ priceInRupees: 1000 })
    await db
      .update(PurchaseTable)
      .set({ status: "completed", referredByInstructorId: own.creator.id })
      .where(eq(PurchaseTable.id, own.purchase.id))
    await createPendingPurchase({ priceInRupees: 500 })
    await createPendingPurchase({ priceInRupees: 700, status: "failed" })
    await createUser("signup-only")

    const after = await getLaunchSummary(30)
    expect(after.paidSales - before.paidSales).toBe(1)
    expect(after.gmvPaisa - before.gmvPaisa).toBe(1000 * 100)
    expect(after.salesViaOwnLink - before.salesViaOwnLink).toBe(1)
    expect(after.checkoutsStarted - before.checkoutsStarted).toBe(3)
    // Every fixture purchase makes a creator and a buyer, plus the extra user.
    expect(after.signups - before.signups).toBe(7)
    expect(after.buyersAmongSignups - before.buyersAmongSignups).toBe(1)

    const today = (await getLaunchDays(7))[0]!
    expect(today.paidSales - daysBefore[0]!.paidSales).toBe(1)
    expect((await getLaunchDays(7)).length).toBe(7)

    const creator = (await getCreatorSales(30)).find((c) => c.userId === own.creator.id)
    expect(creator).toMatchObject({ liveProducts: 1, paidSales: 1, gmvPaisa: 100000, salesViaOwnLink: 1, allTimeSales: 1 })
    expect(creator?.lastSaleAt).toBeInstanceOf(Date)
  })

  it("lists live creators with no sales (the check-in list)", async () => {
    const pending = await createPendingPurchase()
    const row = (await getCreatorSales(30)).find((c) => c.userId === pending.creator.id)
    expect(row).toMatchObject({ paidSales: 0, allTimeSales: 0, lastSaleAt: null })
  })
})
