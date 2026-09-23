import Link from "next/link"
import { eq } from "drizzle-orm"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { db } from "@/drizzle/db"
import { PurchaseTable } from "@/drizzle/schema"
import { getCurrentUser } from "@/services/auth"

const STATUS_COPY: Record<string, string> = {
  failed: "The payment was cancelled or didn't go through.",
  disputed:
    "The payment didn't match this order, so we've held it for review. Our team will contact you.",
  pending:
    "We haven't received confirmation from your payment provider yet. If you completed the payment, it will usually show up within a few minutes.",
}

export default async function ProductPurchaseFailurePage({
  searchParams,
}: {
  searchParams: Promise<{ purchaseId?: string }>
}) {
  const { purchaseId } = await searchParams
  const validId = z.string().uuid().safeParse(purchaseId).success ? purchaseId! : null

  // Only the buyer sees their purchase's details.
  const { userId } = await getCurrentUser()
  const purchase =
    validId != null && userId != null
      ? await db.query.PurchaseTable.findFirst({
          where: eq(PurchaseTable.id, validId),
          columns: { id: true, userId: true, productId: true, status: true, productDetails: true },
        })
      : null
  const ownPurchase = purchase != null && purchase.userId === userId ? purchase : null

  return (
    <div className="container my-6">
      <div className="flex max-w-2xl flex-col items-start gap-4">
        <div className="text-3xl font-semibold">Payment not completed</div>
        {ownPurchase != null && (
          <div className="text-lg font-medium">{ownPurchase.productDetails.name}</div>
        )}
        <div className="text-xl">
          {(ownPurchase && STATUS_COPY[ownPurchase.status]) ??
            "There was a problem with your payment."}
        </div>
        <div className="flex flex-wrap gap-3">
          <Button asChild className="text-xl h-auto py-4 px-8 rounded-lg">
            <Link href={ownPurchase ? `/products/${ownPurchase.productId}/purchase` : "/browse"}>
              Try again
            </Link>
          </Button>
          <Button asChild variant="outline" className="text-xl h-auto py-4 px-8 rounded-lg">
            <Link
              href={
                ownPurchase
                  ? `/support/new?purchaseId=${ownPurchase.id}`
                  : "/support/new?topic=billing"
              }
            >
              I was charged
            </Link>
          </Button>
        </div>
        {ownPurchase != null && (
          <p className="text-sm text-muted-foreground">
            Purchase reference: <span className="font-mono">{ownPurchase.id}</span>
          </p>
        )}
      </div>
    </div>
  )
}
