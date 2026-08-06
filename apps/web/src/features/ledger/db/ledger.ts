import { db } from "@/drizzle/db"
import { LedgerEntryTable } from "@/drizzle/schema"
import { eq, sum } from "drizzle-orm"
import { revalidateLedgerEntryCache } from "./cache"

const PLATFORM_COMMISSION_RATE = 0.15

export async function createLedgerEntry(
  {
    purchaseId,
    courseId,
    instructorId,
    grossAmountPaisa,
  }: { purchaseId: string; courseId: string; instructorId: string; grossAmountPaisa: number },
  trx: Omit<typeof db, "$client"> = db
) {
  const platformFeePaisa = Math.round(grossAmountPaisa * PLATFORM_COMMISSION_RATE)
  const creatorEarningsPaisa = grossAmountPaisa - platformFeePaisa

  const [entry] = await trx
    .insert(LedgerEntryTable)
    .values({
      purchaseId,
      courseId,
      instructorId,
      entryType: "sale",
      grossAmountPaisa,
      platformFeePaisa,
      creatorEarningsPaisa,
    })
    .onConflictDoNothing({ target: [LedgerEntryTable.purchaseId, LedgerEntryTable.courseId, LedgerEntryTable.entryType] })
    .returning()

  if (entry != null) revalidateLedgerEntryCache({ id: entry.id, instructorId })
  return entry
}

/**
 * Writes the negative mirror of every "sale" entry for a purchase. Never
 * edits or deletes the original sale row — the ledger stays a full,
 * append-only audit trail: what was earned, and separately, what was
 * taken back and when.
 */
export async function reverseLedgerEntriesForPurchase(
  purchaseId: string,
  trx: Omit<typeof db, "$client"> = db
) {
  const saleEntries = await trx.query.LedgerEntryTable.findMany({
    where: (entries, { and, eq }) => and(eq(entries.purchaseId, purchaseId), eq(entries.entryType, "sale")),
  })

  const reversals = []
  for (const sale of saleEntries) {
    const [reversal] = await trx
      .insert(LedgerEntryTable)
      .values({
        purchaseId: sale.purchaseId,
        courseId: sale.courseId,
        instructorId: sale.instructorId,
        entryType: "refund",
        grossAmountPaisa: -sale.grossAmountPaisa,
        platformFeePaisa: -sale.platformFeePaisa,
        creatorEarningsPaisa: -sale.creatorEarningsPaisa,
      })
      .onConflictDoNothing({ target: [LedgerEntryTable.purchaseId, LedgerEntryTable.courseId, LedgerEntryTable.entryType] })
      .returning()
    if (reversal != null) {
      revalidateLedgerEntryCache({ id: reversal.id, instructorId: reversal.instructorId })
      reversals.push(reversal)
    }
  }
  return reversals
}

export async function getInstructorLedgerEntries(instructorId: string) {
  return db.query.LedgerEntryTable.findMany({
    where: eq(LedgerEntryTable.instructorId, instructorId),
    orderBy: (entries, { desc }) => desc(entries.createdAt),
  })
}

// Unchanged in logic — summing ALL entries (sale + refund) now correctly
// nets out refunded amounts automatically, no special-casing needed here
export async function getInstructorTotalEarnings(instructorId: string) {
  const [result] = await db
    .select({ total: sum(LedgerEntryTable.creatorEarningsPaisa) })
    .from(LedgerEntryTable)
    .where(eq(LedgerEntryTable.instructorId, instructorId))
  return Number(result?.total ?? 0)
}
