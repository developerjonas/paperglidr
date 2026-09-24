import { z } from "zod";
import { reportReasons } from "@/drizzle/schema/report";

// Products (product page) and lessons (lesson page) can be reported.
export const reportableTargetTypes = ["product", "lesson"] as const;
export type ReportableTargetType = (typeof reportableTargetTypes)[number];

export const reportContentSchema = z.object({
  targetType: z.enum(reportableTargetTypes),
  targetId: z.string().uuid(),
  reason: z.enum(reportReasons),
  details: z.string().trim().max(2000).optional(),
});

export type ReportContentInput = z.infer<typeof reportContentSchema>;

export const reviewReportSchema = z.object({
  reportId: z.string().uuid(),
  status: z.enum(["dismissed", "action_taken"]),
  note: z.string().trim().max(2000).optional(),
});
