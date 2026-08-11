"use server";

import { reportCourseSchema, type ReportCourseInput } from "../schemas/reports";
import { insertReport } from "../db/reports";
import { getCurrentUser } from "@/services/clerk";

export async function reportCourse(input: ReportCourseInput) {
  const session = await getCurrentUser();
  if (session?.user?.id == null) {
    return { error: "You must be signed in to report a course." };
  }

  const { success, data } = reportCourseSchema.safeParse(input);
  if (!success) {
    return { error: "That report couldn't be submitted — check the form." };
  }

  await insertReport({
    reporterId: session.user.id,
    courseId: data.courseId,
    reason: data.reason,
    details: data.details,
  });

  return { success: true };
}
