import { LoadingSpinner } from "@/components/LoadingSpinner"
import { PageHeader } from "@/components/PageHeader"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { db } from "@/drizzle/db"
import { ProductTable, PurchaseTable } from "@/drizzle/schema"
import { getProductIdTag } from "@/features/products/db/cache"
import { userOwnsProduct } from "@/features/products/db/products"
import { wherePublicProducts } from "@/features/products/permissions/products"
import { getCurrentUser } from "@/services/clerk"
import { SignIn, SignUp } from "@clerk/nextjs"
import { and, eq } from "drizzle-orm"
import { cacheTag } from "next/dist/server/use-cache/cache-tag"
import { notFound, redirect } from "next/navigation"
import { Suspense } from "react"

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

  if (user != null) {
    if (await userOwnsProduct({ userId: user.id, productId })) {
      redirect("/courses")
    }

    return (
      <div className="container my-6">
        <Card className="max-w-xl mx-auto overflow-hidden">
          <CardHeader>
            <CardTitle>{product.name}</CardTitle>
            <CardDescription>{product.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">Free</p>
          </CardContent>
          <CardFooter>
            <form action={enrollInProduct.bind(null, productId)} className="w-full">
              <Button type="submit" size="lg" className="w-full">
                Enroll for Free
              </Button>
            </form>
          </CardFooter>
        </Card>
      </div>
    )
  }

  const { authMode } = await searchParams
  const isSignUp = authMode === "signUp"
  return (
    <div className="container my-6 flex flex-col items-center">
      <PageHeader title="You need an account to enroll" />
      {isSignUp ? (
        <SignUp
          routing="hash"
          signInUrl={`/products/${productId}/purchase?authMode=signIn`}
          forceRedirectUrl={`/products/${productId}/purchase`}
        />
      ) : (
        <SignIn
          routing="hash"
          signUpUrl={`/products/${productId}/purchase?authMode=signUp`}
          forceRedirectUrl={`/products/${productId}/purchase`}
        />
      )}
    </div>
  )
}

// Server action — replaces the old Stripe checkout submit.
// Grants access immediately instead of creating a checkout session.
async function enrollInProduct(productId: string) {
  "use server"

  const { user } = await getCurrentUser({ allData: true })
  if (user == null) {
    redirect(`/products/${productId}/purchase`)
  }

  if (await userOwnsProduct({ userId: user.id, productId })) {
    redirect("/courses")
  }

  const product = await getPublicProduct(productId)
  if (product == null) notFound()

  await db.insert(PurchaseTable).values({
    userId: user.id,
    productId,
    pricePaidInCents: 0,
    productDetails: {
      name: product.name,
      description: product.description,
      imageUrl: product.imageUrl,
    },
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
    },
    where: and(eq(ProductTable.id, id), wherePublicProducts),
  })
}
