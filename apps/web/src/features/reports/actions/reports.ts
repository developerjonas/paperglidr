"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db } from "@/drizzle/db";
import { CourseSectionTable, LessonTable, ProductTable } from "@/drizzle/schema";
import { reportContentSchema, reviewReportSchema, type ReportContentInput } from "../schemas/reports";
import { closeReport, insertReport } from "../db/reports";
import { getCurrentUser, requireAdmin } from "@/services/auth";
import { wherePublicProducts } from "@/features/products/permissions/products";
import { canAccessLessonContent } from "@/features/lessons/permissions/lessons";
import { UserFacingError, actionError } from "@/lib/safeError";

// The target must be something the reporter can actually see: a public
// product, or a lesson they're allowed to open.
async function resolveTarget(
  { targetType, targetId }: Pick<ReportContentInput, "targetType" | "targetId">,
  viewer: Parameters<typeof canAccessLessonContent>[0],
) {
  if (targetType === "product") {
    const product = await db.query.ProductTable.findFirst({
      where: and(eq(ProductTable.id, targetId), wherePublicProducts),
      columns: { id: true },
    });
    return product ? { productId: product.id, courseId: null } : null;
  }
  const access = await canAccessLessonContent(viewer, targetId);
  if (!access.allowed) return null;
  const [lesson] = await db
    .select({ courseId: CourseSectionTable.courseId })
    .from(LessonTable)
    .innerJoin(CourseSectionTable, eq(CourseSectionTable.id, LessonTable.sectionId))
    .where(eq(LessonTable.id, targetId))
    .limit(1);
  return lesson ? { productId: null, courseId: lesson.courseId } : null;
}

export async function reportContent(input: ReportContentInput) {
  try {
    const { userId, role } = await getCurrentUser();
    if (userId == null) throw new UserFacingError("Sign in to report content.");

    const parsed = reportContentSchema.safeParse(input);
    if (!parsed.success) {
      throw new UserFacingError("That report couldn't be submitted — check the form.");
    }
    const target = await resolveTarget(parsed.data, { userId, role });
    if (target == null) throw new UserFacingError("That content couldn't be found.");

    await insertReport({ reporterId: userId, ...parsed.data, ...target });
    revalidatePath("/admin/reports");
    return { error: false as const, message: "Thanks — we'll take a look at this." };
  } catch (error) {
    return actionError(error, "reportContent");
  }
}

export async function reviewReport(input: { reportId: string; status: "dismissed" | "action_taken"; note?: string }) {
  const { userId: adminId } = await requireAdmin();
  try {
    const parsed = reviewReportSchema.safeParse(input);
    if (!parsed.success) throw new UserFacingError("Invalid review");
    const report = await closeReport({ ...parsed.data, adminId });
    if (report == null) throw new UserFacingError("This report has already been closed");
    revalidatePath("/admin/reports");
    return { error: false as const, message: "Report closed" };
  } catch (error) {
    return actionError(error, "reviewReport");
  }
}
