import { actionResponse, readJson, requireApiUser, v1Route } from "@/lib/api/v1"
import { reportContent } from "@/features/reports/actions/reports"
import { reportContentSchema } from "@/features/reports/schemas/reports"

/**
 * Report a product or a lesson to the admins.
 * Body: { targetType: "product" | "lesson", targetId, reason, details? }.
 * `reason` values are in the report schema (drizzle/schema/report.ts).
 */
export const POST = v1Route("report content", async req => {
  const gate = await requireApiUser()
  if (!gate.ok) return gate.response

  const input = await readJson(req, reportContentSchema)
  if (!input.ok) return input.response

  return actionResponse(await reportContent(input.data), { successStatus: 201 })
})
