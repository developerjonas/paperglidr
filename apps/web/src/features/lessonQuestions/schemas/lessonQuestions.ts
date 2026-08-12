import { z } from "zod"

export const askQuestionSchema = z.object({
  lessonId: z.string().uuid(),
  body: z.string().min(10, "Add a bit more detail").max(2000),
})
export type AskQuestionValues = z.infer<typeof askQuestionSchema>

export const replyToQuestionSchema = z.object({
  questionId: z.string().uuid(),
  body: z.string().min(1, "Reply can't be empty").max(2000),
})
export type ReplyToQuestionValues = z.infer<typeof replyToQuestionSchema>
