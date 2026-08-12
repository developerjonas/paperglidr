import { PageHeader } from "@/components/PageHeader"
import { db } from "@/drizzle/db"
import { CourseProductTable, CourseTable, ProductTable } from "@/drizzle/schema"
import { DiscountCodeForm } from "@/features/discounts/components/DiscountCodeForm"
import { getProductGlobalTag } from "@/features/products/db/cache"
import { auth } from "@/lib/auth"
import { asc, eq } from "drizzle-orm"
import { cacheTag } from "next/dist/server/use-cache/cache-tag"
import { headers } from "next/headers"

export default async function NewDiscountCodePage({
  searchParams,
}: {
  searchParams: Promise<{ productId?: string }>
}) {
  const { productId } = await searchParams
  const session = await auth.api.getSession({ headers: await headers() })

  return (
    <div className="container my-6">
      <PageHeader title="New Discount Code" />
      <DiscountCodeForm
        products={await getOwnProducts(session?.user?.id)}
        presetProductId={productId}
      />
    </div>
  )
}

// Scoped to products where the current user authored at least one linked
// course. Same "first-author-wins" caveat as the edit page for bundles
// spanning multiple authors.
async function getOwnProducts(authorId: string | undefined) {
  "use cache"
  cacheTag(getProductGlobalTag())
  if (!authorId) return []
  return db
    .selectDistinct({ id: ProductTable.id, name: ProductTable.name })
    .from(ProductTable)
    .innerJoin(CourseProductTable, eq(CourseProductTable.productId, ProductTable.id))
    .innerJoin(CourseTable, eq(CourseTable.id, CourseProductTable.courseId))
    .where(eq(CourseTable.authorId, authorId))
    .orderBy(asc(ProductTable.name))
}
