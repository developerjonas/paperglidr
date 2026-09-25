import { z } from "zod"
import { actionResponse, apiError, isUuid, readJson, requireApiUser, v1Route } from "@/lib/api/v1"
import { replyToLessonQuestion } from "@/features/lessonQuestions/actions/lessonQuestions"
import { replyToQuestionSchema } from "@/features/lessonQuestions/schemas/lessonQuestions"

/**
 * Reply to a lesson question (buyers of the course and its instructor).
 * Body: { body } — 1 to 2000 characters. Emails the asker, as on the web.
 */
export const POST = v1Route<{ questionId: string }>("reply to lesson question", async (req, { params }) => {
  const gate = await requireApiUser()
  if (!gate.ok) return gate.response
  const { questionId } = await params
  if (!isUuid(questionId)) return apiError(404, "Question not found")

  const input = await readJson(req, z.object({ body: replyToQuestionSchema.shape.body }))
  if (!input.ok) return input.response

  const result = await replyToLessonQuestion(questionId, { body: input.data.body })
  return actionResponse(result, {
    errorStatus: result.message === "Question not found." ? 404 : 403,
    successStatus: 201,
  })
})
