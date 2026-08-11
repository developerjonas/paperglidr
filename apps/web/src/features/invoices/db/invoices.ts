import { InvoiceTable, InvoiceSequenceTable } from "@/drizzle/schema";
import { sql } from "drizzle-orm";
import type { Trx } from "@/drizzle/types"; // adjust to whatever your transaction type alias is

/**
 * Approximate Nepal government fiscal-year label (Shrawan 1 → Ashadh end),
 * using a Gregorian mid-July cutover as a stand-in for the exact Bikram
 * Sambat date. This is fine for internal invoice numbering continuity —
 * it is NOT wired to CBMS and doesn't need to be exact yet. Before this
 * ever needs to be IRD-exact, swap in a real BS conversion (e.g. the
 * `nepali-date-converter` package) rather than trusting this approximation.
 */
export function getFiscalYearLabel(date = new Date()) {
  const isAfterCutover =
    date.getMonth() > 6 || (date.getMonth() === 6 && date.getDate() >= 16);
  const startYear = isAfterCutover
    ? date.getFullYear()
    : date.getFullYear() - 1;
  const bsStart = startYear + 57; // rough Gregorian→BS offset, label purposes only
  const bsEnd = (bsStart + 1).toString().slice(-2);
  return `${bsStart}-${bsEnd}`;
}

async function getNextInvoiceSequence(fiscalYear: string, trx: Trx) {
  const [row] = await trx
    .insert(InvoiceSequenceTable)
    .values({ fiscalYear, lastNumber: 1 })
    .onConflictDoUpdate({
      target: InvoiceSequenceTable.fiscalYear,
      set: { lastNumber: sql`${InvoiceSequenceTable.lastNumber} + 1` },
    })
    .returning();
  if (row == null)
    throw new Error(
      `Failed to allocate invoice sequence for fiscal year ${fiscalYear}`,
    );
  return row.lastNumber;
}

export async function createInvoiceForPurchase(
  {
    purchase,
    buyer,
    lineItems,
  }: {
    purchase: { id: string; pricePaidInPaisa: number };
    buyer: { id: string; name: string; email: string };
    lineItems: { description: string; amountPaisa: number }[];
  },
  trx: Trx,
) {
  const fiscalYear = getFiscalYearLabel();
  const seq = await getNextInvoiceSequence(fiscalYear, trx);
  const invoiceNumber = `INV-${fiscalYear}-${String(seq).padStart(6, "0")}`;
  const [invoice] = await trx
    .insert(InvoiceTable)
    .values({
      invoiceNumber,
      fiscalYear,
      purchaseId: purchase.id,
      buyerUserId: buyer.id,
      buyerName: buyer.name,
      buyerEmail: buyer.email,
      sellerName: "Paperglidr Technology Pvt. Ltd.",
      lineItems,
      subtotalPaisa: purchase.pricePaidInPaisa,
      vatRatePercent: null, // flip once VAT-registered
      vatAmountPaisa: null,
      totalPaisa: purchase.pricePaidInPaisa,
      status: "issued",
    })
    .returning();

  if (invoice == null) {
    throw new Error(
      `Failed to create invoice for purchase ${purchase.id}`,
    );
  }

  return invoice;
}
