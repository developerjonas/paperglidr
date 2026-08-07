"use server"
import crypto from "crypto"
import { db } from "@/drizzle/db"
import { getCurrentUser } from "@/services/clerk"
import { PurchaseTable, ProductTable, CourseProductTable } from "@/drizzle/schema"
import { eq } from "drizzle-orm"
import { insertPurchase, updatePurchase, markPurchaseCompleted } from "../db/purchases"
import { esewaGateway } from "@/services/payments/esewa/esewaServer"
import { khaltiGateway } from "@/services/payments/khalti/khaltiServer"
import { fonepayGateway } from "@/services/payments/fonepay/fonepayServer"
import { createLedgerEntry, reverseLedgerEntriesForPurchase } from "@/features/ledger/db/ledger"
import { revalidateProductCache } from "@/features/products/db/cache"
import { addUserCourseAccess, revokeUserCourseAccess } from "@/features/courses/db/userCourseAcccess"
import { canRefundPurchases } from "../permissions/purchases"

const gateways = { esewa: esewaGateway, khalti: khaltiGateway, fonepay: fonepayGateway } as const
type WiredGateway = keyof typeof gateways

export async function initiatePurchase({
  productId,
  gateway,
}: {
  productId: string
  gateway: WiredGateway
}) {
  const { userId } = await getCurrentUser()
  if (userId == null) {
    return { error: true, message: "You must be signed in to purchase", redirectUrl: null, formFields: null, qr: null }
  }

  const product = await db.query.ProductTable.findFirst({ where: eq(ProductTable.id, productId) })
  if (product == null) {
    return { error: true, message: "Product not found", redirectUrl: null, formFields: null, qr: null }
  }

  const idempotencyKey = crypto.randomUUID()
  const purchase = await insertPurchase({
    userId,
    productId,
    gateway,
    status: "pending",
    pricePaidInPaisa: product.priceInDollars * 100, // TODO: still needs your confirmation — see note below
    productDetails: { name: product.name, description: product.description, imageUrl: product.imageUrl },
    idempotencyKey,
    gatewayCheckoutId: idempotencyKey,
  })
  if (purchase == null) {
    return { error: true, message: "Failed to start purchase", redirectUrl: null, formFields: null, qr: null }
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL!
  const successUrl = `${appUrl}/products/${productId}/purchase/success?purchaseId=${purchase.id}`
  const failureUrl = `${appUrl}/products/purchase-failure?purchaseId=${purchase.id}`

  const result = await gateways[gateway].initiate({
    purchaseId: purchase.id,
    amountInPaisa: purchase.pricePaidInPaisa,
    productName: product.name,
    successUrl,
    failureUrl,
  })

  if (result.gatewayTransactionId != null) {
    await updatePurchase(purchase.id, { gatewayTransactionId: result.gatewayTransactionId })
  }

  if (result.type === "redirect") {
    return { error: false, message: "", redirectUrl: result.url, formFields: result.formFields ?? null, qr: null }
  }

  if (result.type === "qr") {
    await updatePurchase(purchase.id, { expiresAt: result.expiresAt })
    return {
      error: false,
      message: "",
      redirectUrl: null,
      formFields: null,
      qr: { qrString: result.qrString, expiresAt: result.expiresAt, purchaseId: purchase.id },
    }
  }

  return { error: true, message: "Unsupported result type for this gateway", redirectUrl: null, formFields: null, qr: null }
}

export async function confirmPurchase({ purchaseId }: { purchaseId: string }) {
  const purchase = await db.query.PurchaseTable.findFirst({ where: eq(PurchaseTable.id, purchaseId) })
  if (purchase == null) return { error: true, message: "Purchase not found" }
  if (purchase.status === "completed") return { error: false, message: "Already confirmed" }

  const verification = await gateways[purchase.gateway as WiredGateway].verify({
    gatewayCheckoutId: purchase.gatewayCheckoutId,
    gatewayTransactionId: purchase.gatewayTransactionId,
    amountInPaisa: purchase.pricePaidInPaisa,
  })
  if (!verification.verified) return { error: true, message: "Payment could not be verified" }

  const result = await db.transaction(async trx => {
    const completed = await markPurchaseCompleted(
      {
        id: purchase.id,
        gatewayTransactionId: verification.gatewayTransactionId ?? purchase.gatewayTransactionId ?? "",
        rawGatewayResponse: verification.raw,
      },
      trx
    )
    if (completed == null) return null

    const courseProducts = await trx.query.CourseProductTable.findMany({
      where: eq(CourseProductTable.productId, completed.productId),
      with: { course: { columns: { id: true, authorId: true } } },
    })
    const courseIds = courseProducts.map(cp => cp.course.id)

    await addUserCourseAccess({ userId: completed.userId, courseIds }, trx)

    const splitAmountPaisa = Math.floor(completed.pricePaidInPaisa / courseProducts.length)
    for (const cp of courseProducts) {
      await createLedgerEntry(
        {
          purchaseId: completed.id,
          courseId: cp.course.id,
          instructorId: cp.course.authorId,
          grossAmountPaisa: splitAmountPaisa,
        },
        trx
      )
    }

    return completed
  })

  if (result == null) return { error: false, message: "Already processed" }

  revalidateProductCache(result.productId)
  return { error: false, message: "Purchase confirmed" }
}

export async function revokeAccess(purchaseId: string) {
  const user = await getCurrentUser()
  if (!canRefundPurchases(user)) {
    return { error: true, message: "You don't have permission to issue refunds" }
  }

  const purchase = await db.query.PurchaseTable.findFirst({ where: eq(PurchaseTable.id, purchaseId) })
  if (purchase == null) return { error: true, message: "Purchase not found" }
  if (purchase.refundedAt != null) return { error: true, message: "Already refunded" }

  await db.transaction(async trx => {
    await updatePurchase(purchase.id, { refundedAt: new Date(), status: "refunded" }, trx)
    await revokeUserCourseAccess({ userId: purchase.userId, productId: purchase.productId }, trx)
    await reverseLedgerEntriesForPurchase(purchase.id, trx)
  })

  revalidateProductCache(purchase.productId)
  return { error: false, message: "Successfully refunded and revoked access" }
}
