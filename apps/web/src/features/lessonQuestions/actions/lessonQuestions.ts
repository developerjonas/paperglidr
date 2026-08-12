"use server"

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
import {
  insertLessonQuestion,
  insertLessonQuestionReply,
  getLessonQuestionById,
} from "@/features/lessonQuestions/db/lessonQuestions"
import { revalidateLessonQuestionsCache } from "@/features/lessonQuestions/db/cache"
import { sendReplyNotification } from "@/features/lessonQuestions/lib/sendReplyNotification"

export async function askLessonQuestion(
  lessonId: string,
  unsafeData: { body: string }
) {
  const { userId, role } = await getCurrentUser()
  if (userId == null) {
    return { error: true, message: "You must be logged in to ask a question." }
  }

  const { success, data } = askQuestionSchema.safeParse({
    lessonId,
    body: unsafeData.body,
  })

  const canAsk =
    success && (await canAskLessonQuestion({ role, userId }, lessonId))
  if (!canAsk) {
    return {
      error: true,
      message: "You don't have permission to ask a question on this lesson.",
    }
  }

  // insertLessonQuestion revalidates internally — don't do it again here.
  await insertLessonQuestion({ lessonId, userId, body: data!.body })

  return { error: false, message: "Question posted." }
}

export async function replyToLessonQuestion(
  questionId: string,
  unsafeData: { body: string }
) {
  const { userId, role } = await getCurrentUser()
  if (userId == null) {
    return { error: true, message: "You must be logged in to reply." }
  }

  const question = await getLessonQuestionById(questionId)
  if (question == null) {
    return { error: true, message: "Question not found." }
  }

  const { success, data } = replyToQuestionSchema.safeParse({
    questionId,
    body: unsafeData.body,
  })

  const canReply =
    success &&
    (await canReplyToLessonQuestion({ role, userId }, question.lessonId))
  if (!canReply) {
    return {
      error: true,
      message: "You don't have permission to reply to this question.",
    }
  }

  await insertLessonQuestionReply({ questionId, userId, body: data!.body })
  revalidateLessonQuestionsCache(question.lessonId)

  if (question.userId !== userId) {
    const replier = await db.query.UserTable.findFirst({
      where: eq(UserTable.id, userId),
      columns: { name: true },
    })

    sendReplyNotification({
      lessonId: question.lessonId,
      askerUserId: question.userId,
      replierName: replier?.name ?? "Someone",
      replyBody: data!.body,
    }).catch(err => {
      console.error("Failed to send lesson question reply notification", err)
    })
  }

  return { error: false, message: "Reply posted." }
}
