"use server"
import { db } from "@/drizzle/db"
import { PurchaseTable, CourseProductTable, UserTable } from "@/drizzle/schema"
import { eq } from "drizzle-orm"
import { markPurchaseCompleted } from "../db/purchases"
import { esewaGateway } from "@/services/payments/esewa/esewaServer"
import { khaltiGateway } from "@/services/payments/khalti/khaltiServer"
import { fonepayGateway } from "@/services/payments/fonepay/fonepayServer"
import { createLedgerEntry } from "@/features/ledger/db/ledger"
import { createInvoiceForPurchase } from "@/features/invoices/db/invoices"
import { generateAndSendInvoice } from "@/features/invoices/actions/generateAndSendInvoice"
import { revalidateProductCache } from "@/features/products/db/cache"
import { addUserCourseAccess } from "@/features/courses/db/userCourseAcccess"

const gateways = { esewa: esewaGateway, khalti: khaltiGateway, fonepay: fonepayGateway } as const
type WiredGateway = keyof typeof gateways

// ... initiatePurchase unchanged ...

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
      with: { course: { columns: { id: true, authorId: true, name: true } } },
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

    // Buyer details for the invoice — confirmPurchase never touched
    // UserTable before this, so this is a new lookup.
    const buyer = await trx.query.UserTable.findFirst({ where: eq(UserTable.id, completed.userId) })
    if (buyer == null) throw new Error(`Buyer ${completed.userId} not found while creating invoice`)

    const invoice = await createInvoiceForPurchase(
      {
        purchase: completed,
        buyer: { id: buyer.id, name: buyer.name, email: buyer.email },
        lineItems: courseProducts.map(cp => ({
          description: cp.course.name,
          amountPaisa: splitAmountPaisa,
        })),
      },
      trx
    )

    return { ...completed, invoiceId: invoice.id }
  })

  if (result == null) return { error: false, message: "Already processed" }

  revalidateProductCache(result.productId)

  // Fire-and-forget, deliberately outside the transaction: PDF rendering
  // and email delivery are external I/O and must never roll back a
  // purchase that's already committed. Failure here is logged, not thrown —
  // invoice.pdfR2Key/emailedAt staying null is the retry signal for later.
  generateAndSendInvoice(result.invoiceId).catch(err => {
    console.error(`Invoice generation/send failed for purchase ${result.id}`, err)
  })

  return { error: false, message: "Purchase confirmed" }
}

// ... revokeAccess unchanged ...
