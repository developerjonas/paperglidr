"use server"

import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { db } from "@/drizzle/db"
import { InvoiceTable } from "@/drizzle/schema"
import { generateAndSendInvoice } from "@/features/invoices/actions/generateAndSendInvoice"
import { actionError, UserFacingError } from "@/lib/safeError"
import { requireAdmin } from "@/services/auth"

/**
 * Sends a purchase's invoice now (PDF + email), e.g. after the automatic
 * retries gave up. Never emails twice: an invoice already sent is left alone.
 */
export async function sendInvoiceNow(purchaseId: string) {
  await requireAdmin()
  try {
    const invoice = await db.query.InvoiceTable.findFirst({
      where: eq(InvoiceTable.purchaseId, z.string().uuid().parse(purchaseId)),
      columns: { id: true, emailedAt: true },
    })
    if (invoice == null) throw new UserFacingError("This purchase has no invoice.")
    if (invoice.emailedAt != null) return { error: false, message: "Already emailed." }
    try {
      await generateAndSendInvoice(invoice.id)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      await db.update(InvoiceTable).set({ lastDeliveryError: message.slice(0, 1000) }).where(eq(InvoiceTable.id, invoice.id))
      throw error
    }
    revalidatePath(`/admin/purchases/${purchaseId}`)
    return { error: false, message: "Invoice emailed." }
  } catch (error) {
    return actionError(error, "sendInvoiceNow", "Couldn't send the invoice. The error is saved on the invoice.")
  }
}
