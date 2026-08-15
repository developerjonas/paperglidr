// Destination: apps/web/src/features/ledger/db/revenue.ts
// Standalone file so it doesn't collide with whatever's already in your
// existing features/ledger/db/ledger.ts — merge them if you'd rather
// keep everything in one file.
//
// "ledgerEntries" is already in your CACHE_TAG union (saw it in
// dataCache.ts), so no edit needed there for this one.

import { db } from "@/drizzle/db";
import { LedgerEntryTable } from "@/drizzle/schema";
import { and, eq, gte, sql, sum } from "drizzle-orm";
import { cacheTag } from "next/dist/server/use-cache/cache-tag";
import { getGlobalTag } from "@/lib/dataCache";

function getLedgerRevenueGlobalTag() {
  return getGlobalTag("ledgerEntries");
}

export async function getRevenueSummary() {
  "use cache";
  cacheTag(getLedgerRevenueGlobalTag());

  const [totals] = await db
    .select({
      grossPaisa: sum(LedgerEntryTable.grossAmountPaisa),
      platformFeePaisa: sum(LedgerEntryTable.platformFeePaisa),
      creatorEarningsPaisa: sum(LedgerEntryTable.creatorEarningsPaisa),
      saleCount: sql<number>`count(*) filter (where ${LedgerEntryTable.entryType} = 'sale')`,
      refundCount: sql<number>`count(*) filter (where ${LedgerEntryTable.entryType} = 'refund')`,
    })
    .from(LedgerEntryTable);

  return {
    grossPaisa: Number(totals?.grossPaisa ?? 0),
    platformFeePaisa: Number(totals?.platformFeePaisa ?? 0),
    creatorEarningsPaisa: Number(totals?.creatorEarningsPaisa ?? 0),
    saleCount: Number(totals?.saleCount ?? 0),
    refundCount: Number(totals?.refundCount ?? 0),
  };
}

export async function getRevenueByMonth(monthsBack = 6) {
  "use cache";
  cacheTag(getLedgerRevenueGlobalTag());

  const since = new Date();
  since.setMonth(since.getMonth() - monthsBack);

  const rows = await db
    .select({
      month: sql<string>`to_char(${LedgerEntryTable.createdAt}, 'YYYY-MM')`,
      grossPaisa: sum(LedgerEntryTable.grossAmountPaisa),
      platformFeePaisa: sum(LedgerEntryTable.platformFeePaisa),
      creatorEarningsPaisa: sum(LedgerEntryTable.creatorEarningsPaisa),
    })
    .from(LedgerEntryTable)
    .where(
      and(
        eq(LedgerEntryTable.entryType, "sale"),
        gte(LedgerEntryTable.createdAt, since),
      ),
    )
    .groupBy(sql`to_char(${LedgerEntryTable.createdAt}, 'YYYY-MM')`)
    .orderBy(sql`to_char(${LedgerEntryTable.createdAt}, 'YYYY-MM')`);

  return rows.map((r) => ({
    month: r.month,
    grossPaisa: Number(r.grossPaisa ?? 0),
    platformFeePaisa: Number(r.platformFeePaisa ?? 0),
    creatorEarningsPaisa: Number(r.creatorEarningsPaisa ?? 0),
  }));
}

export async function getRevenueBySource() {
  "use cache";
  cacheTag(getLedgerRevenueGlobalTag());

  const rows = await db
    .select({
      revenueSource: LedgerEntryTable.revenueSource,
      grossPaisa: sum(LedgerEntryTable.grossAmountPaisa),
      platformFeePaisa: sum(LedgerEntryTable.platformFeePaisa),
      count: sql<number>`count(*)`,
    })
    .from(LedgerEntryTable)
    .where(eq(LedgerEntryTable.entryType, "sale"))
    .groupBy(LedgerEntryTable.revenueSource);

  return rows.map((r) => ({
    revenueSource: r.revenueSource,
    grossPaisa: Number(r.grossPaisa ?? 0),
    platformFeePaisa: Number(r.platformFeePaisa ?? 0),
    count: Number(r.count),
  }));
}
