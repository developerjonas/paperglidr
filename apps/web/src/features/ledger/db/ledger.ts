import { db } from "@/drizzle/db";
import { LedgerEntryTable } from "@/drizzle/schema";
import { eq, sum } from "drizzle-orm";
import { revalidateLedgerEntryCache } from "./cache";

// TODO: move to a real config table if commission ever varies per-course or
// per-instructor. A single flat constant is fine while you have one rate.
// CONFIRM this against whatever percentage you've actually agreed to.
const PLATFORM_COMMISSION_RATE = 0.15;

export async function createLedgerEntry(
  {
    purchaseId,
    courseId,
    instructorId,
    grossAmountPaisa,
  }: {
    purchaseId: string;
    courseId: string;
    instructorId: string;
    grossAmountPaisa: number;
  },
  trx: Omit<typeof db, "$client"> = db,
) {
  const platformFeePaisa = Math.round(
    grossAmountPaisa * PLATFORM_COMMISSION_RATE,
  );
  const creatorEarningsPaisa = grossAmountPaisa - platformFeePaisa;

  const [entry] = await trx
    .insert(LedgerEntryTable)
    .values({
      purchaseId,
      courseId,
      instructorId,
      grossAmountPaisa,
      platformFeePaisa,
      creatorEarningsPaisa,
    })
    .onConflictDoNothing({ target: LedgerEntryTable.purchaseId }) // guarantees one entry per purchase
    .returning();

  if (entry != null) revalidateLedgerEntryCache({ id: entry.id, instructorId });
  return entry;
}

export async function getInstructorLedgerEntries(instructorId: string) {
  return db.query.LedgerEntryTable.findMany({
    where: eq(LedgerEntryTable.instructorId, instructorId),
    orderBy: (entries, { desc }) => desc(entries.createdAt),
  });
}

export async function getInstructorTotalEarnings(instructorId: string) {
  const [result] = await db
    .select({ total: sum(LedgerEntryTable.creatorEarningsPaisa) })
    .from(LedgerEntryTable)
    .where(eq(LedgerEntryTable.instructorId, instructorId));
  return Number(result?.total ?? 0);
}
