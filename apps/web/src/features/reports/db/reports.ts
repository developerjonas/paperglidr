import { db } from "@/drizzle/db";
import { ReportTable, reportReasons } from "@/drizzle/schema/report";

export async function insertReport(data: {
  reporterId: string;
  courseId: string;
  reason: (typeof reportReasons)[number];
  details?: string;
}) {
  const [report] = await db
    .insert(ReportTable)
    .values({
      reporterId: data.reporterId,
      targetType: "course",
      targetId: data.courseId,
      courseId: data.courseId,
      reason: data.reason,
      details: data.details,
    })
    .returning();

  return report;
}

// Admin review queue. Add pagination once volume warrants it.
export async function getReportsForAdmin() {
  return db.query.ReportTable.findMany({
    orderBy: (report, { desc }) => desc(report.createdAt),
    with: { course: true, reporter: true },
  });
}
