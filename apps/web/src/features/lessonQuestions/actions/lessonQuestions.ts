"use server"

import { z } from "zod"
import { eq } from "drizzle-orm"
import { db } from "@/drizzle/db"
import { UserTable } from "@/drizzle/schema"
import { getCurrentUser } from "@/services/clerk"
import {
  askQuestionSchema,
  replyToQuestionSchema,
} from "@/features/lessonQuestions/schemas/lessonQuestions"
import {
  canAskLessonQuestion,
  canReplyToLessonQuestion,
} from "@/features/lessonQuestions/permissions/lessonQuestions"
import { getLessonCourseContext } from "@/features/lessonQuestions/lib/lessonAccess"
import {
  insertLessonQuestion,
  insertLessonQuestionReply,
  getLessonQuestionById,
} from "@/features/lessonQuestions/db/lessonQuestions"
import { revalidateLessonQuestionsCache } from "@/features/lessonQuestions/db/cache"
import { sendReplyNotification } from "@/features/lessonQuestions/lib/sendReplyNotification"

export async function askLessonQuestion(
  lessonId: string,
  unsafeData: z.infer<typeof askQuestionSchema>
) {
  const { userId, role } = await getCurrentUser()
  if (userId == null) {
    return {
      error: true,
      message: "You must be logged in to ask a question.",
    }
  }

  const { success, data } = askQuestionSchema.safeParse(unsafeData)
  const context = await getLessonCourseContext(lessonId)

  const canAsk =
    success &&
    context != null &&
    (await canAskLessonQuestion({ role, userId }, context.courseId))

  if (!canAsk) {
    return {
      error: true,
      message: "You don't have permission to ask a question on this lesson.",
    }
  }

  // insertLessonQuestion revalidates the lesson's Q&A cache tag internally —
  // don't revalidate again here.
  await insertLessonQuestion({
    lessonId,
    userId,
    body: data.body,
  })

  return { error: false, message: "Question posted." }
}

export async function replyToLessonQuestion(
  questionId: string,
  unsafeData: z.infer<typeof replyToQuestionSchema>
) {
  const { userId, role } = await getCurrentUser()
  if (userId == null) {
    return { error: true, message: "You must be logged in to reply." }
  }

  const { success, data } = replyToQuestionSchema.safeParse(unsafeData)

  const question = await getLessonQuestionById(questionId)
  if (question == null) {
    return { error: true, message: "Question not found." }
  }

  const context = await getLessonCourseContext(question.lessonId)

  const canReply =
    success &&
    context != null &&
    (await canReplyToLessonQuestion({ role, userId }, context.courseId))

  if (!canReply) {
    return {
      error: true,
      message: "You don't have permission to reply to this question.",
    }
  }

  await insertLessonQuestionReply({
    questionId,
    userId,
    body: data.body,
  })

  // Unlike insertLessonQuestion, insertLessonQuestionReply doesn't
  // revalidate on its own — do it here.
  revalidateLessonQuestionsCache(question.lessonId)

  // Fire-and-forget, outside the critical path — matches
  // generateAndSendInvoice's pattern. Skip self-notification if replying
  // to your own question.
  if (question.userId !== userId) {
    const replier = await db.query.UserTable.findFirst({
      where: eq(UserTable.id, userId),
      columns: { name: true },
    })

    sendReplyNotification({
      lessonId: question.lessonId,
      askerUserId: question.userId,
      replierName: replier?.name ?? "Someone",
      replyBody: data.body,
    }).catch(err => {
      console.error("Failed to send lesson question reply notification", err)
    })
  }

  return { error: false, message: "Reply posted." }
}
