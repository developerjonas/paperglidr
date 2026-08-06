import { LoadingSpinner } from "@/components/LoadingSpinner"
import { Button } from "@/components/ui/button"
import { db } from "@/drizzle/db"
import { ProductTable } from "@/drizzle/schema"
import { getProductIdTag } from "@/features/products/db/cache"
import { wherePublicProducts } from "@/features/products/permissions/products"
import { confirmPurchase } from "@/features/purchases/actions/purchases"
import { and, eq } from "drizzle-orm"
import { cacheTag } from "next/dist/server/use-cache/cache-tag"
import { AlertCircleIcon, CheckCircle2Icon, ClockIcon } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Suspense } from "react"

export default function ProductPurchaseSuccessPage({
  params,
  searchParams,
}: {
  params: Promise<{ productId: string }>
  searchParams: Promise<{ purchaseId?: string }>
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
  searchParams: Promise<{ purchaseId?: string }>
}) {
  const { productId } = await params
  const { purchaseId } = await searchParams

  const product = await getPublicProduct(productId)
  if (product == null) return notFound()

  // No purchaseId in the URL means someone hit this page directly rather
  // than arriving via a real gateway redirect — there's nothing to confirm
  if (purchaseId == null) {
    return (
      <PurchaseStatusLayout
        product={product}
        icon={<AlertCircleIcon className="size-10 text-destructive" />}
        title="We couldn't find that purchase"
        message="This link looks incomplete. If you just paid, check your email for a receipt, or contact support."
      />
    )
  }

  // The actual verification — this is the whole reason this page exists.
  // Every previous version rendered "success" unconditionally; this is the
  // one call that makes the headline true instead of assumed.
  const result = await confirmPurchase({ purchaseId })

  if (!result.error) {
    return (
      <PurchaseStatusLayout
        product={product}
        icon={<CheckCircle2Icon className="size-10 text-emerald-600" />}
        title="Purchase Successful"
        message={`Thank you for purchasing ${product.name}.`}
        showCoursesLink
      />
    )
  }

  // "Already processed" is the concurrent-webhook-race case from
  // confirmPurchase — not a real failure, treat it as success since the
  // purchase genuinely did complete, just via a different request
  if (result.message === "Already processed" || result.message === "Already confirmed") {
    return (
      <PurchaseStatusLayout
        product={product}
        icon={<CheckCircle2Icon className="size-10 text-emerald-600" />}
        title="Purchase Successful"
        message={`Thank you for purchasing ${product.name}.`}
        showCoursesLink
      />
    )
  }

  // Genuinely unverified — most likely with Fonepay/QR gateways where
  // payment hasn't cleared yet, or the gateway hasn't responded at all.
  // Never claim success here; that's the exact bug this page used to have.
  return (
    <PurchaseStatusLayout
      product={product}
      icon={<ClockIcon className="size-10 text-amber-600" />}
      title="Payment Pending"
      message="We're still waiting for confirmation from your payment provider. This page will update once it clears — no need to pay twice."
    />
  )
}

function PurchaseStatusLayout({
  product,
  icon,
  title,
  message,
  showCoursesLink,
}: {
  product: { name: string; imageUrl: string }
  icon: React.ReactNode
  title: string
  message: string
  showCoursesLink?: boolean
}) {
  return (
    <div className="container my-6">
      <div className="flex gap-16 items-center justify-between">
        <div className="flex flex-col gap-4 items-start">
          {icon}
          <div className="text-3xl font-semibold">{title}</div>
          <div className="text-xl">{message}</div>
          {showCoursesLink && (
            <Button asChild className="text-xl h-auto py-4 px-8 rounded-lg">
              <Link href="/courses">View My Courses</Link>
            </Button>
          )}
        </div>
        <div className="relative aspect-video max-w-lg flex-grow">
          <Image src={product.imageUrl} alt={product.name} fill className="object-contain rounded-xl" />
        </div>
      </div>
    </div>
  )
}

async function getPublicProduct(id: string) {
  "use cache"
  cacheTag(getProductIdTag(id))
  return db.query.ProductTable.findFirst({
    columns: { name: true, imageUrl: true },
    where: and(eq(ProductTable.id, id), wherePublicProducts),
  })
}
