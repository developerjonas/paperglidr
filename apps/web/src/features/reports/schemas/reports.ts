import { z } from "zod";
import { reportReasons } from "@/drizzle/schema/report";

export const reportCourseSchema = z.object({
  courseId: z.string().uuid(),
  reason: z.enum(reportReasons),
  details: z.string().max(2000).optional(),
});

export type ReportCourseInput = z.infer<typeof reportCourseSchema>;
