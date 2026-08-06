import { LoadingSpinner } from "@/components/LoadingSpinner"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { db } from "@/drizzle/db"
import { ProductTable } from "@/drizzle/schema"
import { getProductIdTag } from "@/features/products/db/cache"
import { userOwnsProduct } from "@/features/products/db/products"
import { wherePublicProducts } from "@/features/products/permissions/products"
import { insertPurchase } from "@/features/purchases/db/purchases"
import { addUserCourseAccess } from "@/features/courses/db/userCourseAcccess"
import { formatPrice } from "@/lib/formatters"
import { getCurrentUser } from "@/services/clerk"
import { and, eq } from "drizzle-orm"
import { cacheTag } from "next/dist/server/use-cache/cache-tag"
import { notFound, redirect } from "next/navigation"
import { Suspense } from "react"
import crypto from "crypto"
import { PurchaseGatewayPicker } from "@/features/purchases/components/PurchaseGatewayPicker"

export default function PurchasePage({
  params,
  searchParams,
}: {
  params: Promise<{ productId: string }>
  searchParams: Promise<{ authMode: string }>
}) {
  return (
    <Suspense fallback={<LoadingSpinner className="my-6 size-36 mx-auto" />}>
      <SuspendedComponent params={params} searchParams={searchParams} />
    </Suspense>
  )
}

async function SuspendedComponent({
  params,
  searchParams,
}: {
  params: Promise<{ productId: string }>
  searchParams: Promise<{ authMode: string }>
}) {
  const { productId } = await params
  const { user } = await getCurrentUser({ allData: true })
  const product = await getPublicProduct(productId)
  if (product == null) return notFound()

  if (user == null) {
    const { authMode } = await searchParams
    const isSignUp = authMode === "signUp"
    const callbackUrl = `/products/${productId}/purchase`

    redirect(
      isSignUp
        ? `/sign-up?redirectTo=${encodeURIComponent(callbackUrl)}`
        : `/sign-in?redirectTo=${encodeURIComponent(callbackUrl)}`
    )
  }

  if (await userOwnsProduct({ userId: user.id, productId })) {
    redirect("/courses")
  }

  const isFree = product.priceInDollars === 0

  return (
    <div className="container my-6">
      <Card className="max-w-xl mx-auto overflow-hidden">
        <CardHeader>
          <CardTitle>{product.name}</CardTitle>
          <CardDescription>{product.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-lg font-semibold">
            {isFree ? "Free" : formatPrice(product.priceInDollars)}
          </p>
        </CardContent>
        <CardFooter>
          {isFree ? (
            <form action={enrollInFreeProduct.bind(null, productId)} className="w-full">
              <Button type="submit" size="lg" className="w-full">
                Enroll for Free
              </Button>
            </form>
          ) : (
            <PurchaseGatewayPicker productId={productId} />
          )}
        </CardFooter>
      </Card>
    </div>
  )
}

// Free products skip the gateway entirely — no verification is possible or
// needed for money that never moved. Marked "completed" immediately, with
// gateway: "free" so the schema's notNull constraints stay honest instead
// of faking a payment provider that was never involved.
async function enrollInFreeProduct(productId: string) {
  "use server"

  const { user } = await getCurrentUser({ allData: true })
  if (user == null) {
    redirect(`/products/${productId}/purchase`)
  }

  if (await userOwnsProduct({ userId: user.id, productId })) {
    redirect("/courses")
  }

  const product = await db.query.ProductTable.findFirst({
    where: and(eq(ProductTable.id, productId), wherePublicProducts),
    with: { courseProducts: { columns: { courseId: true } } },
  })
  if (product == null) notFound()

  const idempotencyKey = crypto.randomUUID()

  await db.transaction(async trx => {
    await insertPurchase(
      {
        userId: user.id,
        productId,
        gateway: "free",
        status: "completed",
        pricePaidInPaisa: 0,
        idempotencyKey,
        gatewayCheckoutId: idempotencyKey,
        productDetails: {
          name: product.name,
          description: product.description,
          imageUrl: product.imageUrl,
        },
      },
      trx
    )

    await addUserCourseAccess(
      { userId: user.id, courseIds: product.courseProducts.map(cp => cp.courseId) },
      trx
    )
  })

  redirect("/courses")
}

async function getPublicProduct(id: string) {
  "use cache"
  cacheTag(getProductIdTag(id))
  return db.query.ProductTable.findFirst({
    columns: {
      name: true,
      id: true,
      imageUrl: true,
      description: true,
      priceInDollars: true, // added — page couldn't tell free vs paid without this
    },
    where: and(eq(ProductTable.id, id), wherePublicProducts),
  })
}
