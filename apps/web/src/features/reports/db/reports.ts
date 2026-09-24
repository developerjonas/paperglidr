import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/drizzle/db";
import { ReportTable, reportReasons } from "@/drizzle/schema/report";

/**
 * One open report per reporter and target: a repeat report of the same
 * thing while the first is still open is a no-op (returns null).
 */
export async function insertReport(data: {
  reporterId: string;
  targetType: "product" | "lesson";
  targetId: string;
  productId: string | null;
  courseId: string | null;
  reason: (typeof reportReasons)[number];
  details?: string;
}) {
  const existing = await db.query.ReportTable.findFirst({
    where: and(
      eq(ReportTable.reporterId, data.reporterId),
      eq(ReportTable.targetType, data.targetType),
      eq(ReportTable.targetId, data.targetId),
      inArray(ReportTable.status, ["pending", "reviewing"]),
    ),
    columns: { id: true },
  });
  if (existing) return null;

  const [report] = await db.insert(ReportTable).values(data).returning();
  return report;
}

// Admin review queue: open reports first, newest first. Add pagination once
// volume warrants it.
export async function getReportsForAdmin() {
  const withDetails = {
    reporter: { columns: { name: true, email: true } },
    reviewer: { columns: { name: true, email: true } },
    course: { columns: { id: true, name: true } },
    product: { columns: { id: true, name: true, status: true } },
  } as const;
  const [open, closed] = await Promise.all([
    db.query.ReportTable.findMany({
      where: inArray(ReportTable.status, ["pending", "reviewing"]),
      orderBy: desc(ReportTable.createdAt),
      with: withDetails,
    }),
    db.query.ReportTable.findMany({
      where: inArray(ReportTable.status, ["dismissed", "action_taken"]),
      orderBy: desc(ReportTable.reviewedAt),
      limit: 50,
      with: withDetails,
    }),
  ]);
  return { open, closed };
}

export async function closeReport({
  reportId,
  status,
  note,
  adminId,
}: {
  reportId: string;
  status: "dismissed" | "action_taken";
  note?: string;
  adminId: string;
}) {
  const now = new Date();
  const [report] = await db
    .update(ReportTable)
    .set({ status, adminNote: note || null, reviewedBy: adminId, reviewedAt: now, updatedAt: now })
    .where(and(eq(ReportTable.id, reportId), inArray(ReportTable.status, ["pending", "reviewing"])))
    .returning();
  return report ?? null;
}
