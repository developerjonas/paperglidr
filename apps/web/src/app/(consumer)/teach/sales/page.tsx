import { PageHeader } from "@/components/PageHeader"
import { db } from "@/drizzle/db"
import { PurchaseTable as DbPurchaseTable } from "@/drizzle/schema"
import { PurchaseTable } from "@/features/purchases/components/PurchaseTable"
import { getPurchaseGlobalTag } from "@/features/purchases/db/cache"
import { getUserGlobalTag } from "@/features/users/db/cache"
import { getCurrentUser } from "@/services/clerk"
import { desc } from "drizzle-orm"
import { cacheTag } from "next/dist/server/use-cache/cache-tag"
import { redirect } from "next/navigation"

export default async function PurchasesPage() {
  const { role } = await getCurrentUser()
  if (role !== "admin") redirect("/")

  const purchases = await getPurchases()
  return (
    <div className="container my-6">
      <PageHeader title="Sales" />
      <PurchaseTable purchases={purchases} />
    </div>
  )
}

async function getPurchases() {
  "use cache"
  cacheTag(getPurchaseGlobalTag(), getUserGlobalTag())
  return db.query.PurchaseTable.findMany({
    columns: {
      id: true,
      pricePaidInPaisa: true,
      refundedAt: true,
      productDetails: true,
      createdAt: true,
    },
    orderBy: desc(DbPurchaseTable.createdAt),
    with: { user: { columns: { name: true } } },
  })
}
