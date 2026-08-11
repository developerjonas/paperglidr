// features/invoices/actions/generateAndSendInvoice.tsx
import { Resend } from "resend"
import { renderToBuffer } from "@react-pdf/renderer"
import { db } from "@/drizzle/db"
import { InvoiceTable } from "@/drizzle/schema"
import { eq } from "drizzle-orm"
import { type InvoiceDocumentData, InvoiceDocument } from "../pdf/InvoiceDocument"
import { putObject } from "@/services/storage/r2"

const resend = new Resend(process.env.RESEND_API_KEY!)

export async function generateAndSendInvoice(invoiceId: string) {
  const invoice = await db.query.InvoiceTable.findFirst({ where: eq(InvoiceTable.id, invoiceId) })
  if (invoice == null) throw new Error(`Invoice ${invoiceId} not found`)

  const invoiceData: InvoiceDocumentData = {
    invoiceNumber: invoice.invoiceNumber,
    createdAt: invoice.createdAt,
    sellerName: invoice.sellerName,
    sellerPan: invoice.sellerPan,
    buyerName: invoice.buyerName,
    buyerEmail: invoice.buyerEmail,
    buyerPan: invoice.buyerPan,
    lineItems: invoice.lineItems,
    subtotalPaisa: invoice.subtotalPaisa,
    vatRatePercent: invoice.vatRatePercent,
    vatAmountPaisa: invoice.vatAmountPaisa,
    totalPaisa: invoice.totalPaisa,
  }

  const pdfBuffer = await renderToBuffer(<InvoiceDocument invoice={invoiceData} />)

  const r2Key = `invoices/${invoice.id}.pdf`
  await putObject({ storageKey: r2Key, body: pdfBuffer, contentType: "application/pdf" })

  const { error } = await resend.emails.send({
    from: process.env.INVOICE_FROM_EMAIL!, // e.g. "Paperglidr <billing@paperglidr.com>" — domain must be verified in Resend
    to: invoice.buyerEmail,
    subject: `Your Paperglidr invoice ${invoice.invoiceNumber}`,
    html: `
      <p>Hi ${invoice.buyerName},</p>
      <p>Thanks for your purchase. Your invoice <strong>${invoice.invoiceNumber}</strong> is attached.</p>
      <p>Total paid: NPR ${(invoice.totalPaisa / 100).toFixed(2)}</p>
    `,
    attachments: [
      {
        filename: `${invoice.invoiceNumber}.pdf`,
        content: pdfBuffer,
      },
    ],
  })

  if (error) {
    throw new Error(`Resend failed for invoice ${invoice.id}: ${error.message}`)
  }

  await db
    .update(InvoiceTable)
    .set({ pdfR2Key: r2Key, emailedAt: new Date() })
    .where(eq(InvoiceTable.id, invoice.id))
}
