import { db } from "@/drizzle/db"
import { LessonQuestionTable, LessonQuestionReplyTable } from "@/drizzle/schema"
import { eq } from "drizzle-orm"
import { revalidateLessonQuestionsCache } from "./cache"

export async function insertLessonQuestion(data: {
  lessonId: string
  userId: string
  body: string
}) {
  const [question] = await db.insert(LessonQuestionTable).values(data).returning()
  if (question == null) throw new Error("Failed to create question")
  revalidateLessonQuestionsCache(question.lessonId)
  return question
}

export async function insertLessonQuestionReply(data: {
  questionId: string
  userId: string
  body: string
}) {
  const [reply] = await db
    .insert(LessonQuestionReplyTable)
    .values(data)
    .returning()
  if (reply == null) throw new Error("Failed to create reply")
  return reply
}

export async function getLessonQuestionById(id: string) {
  return db.query.LessonQuestionTable.findFirst({
    where: eq(LessonQuestionTable.id, id),
  })
}

// No "use cache"/cacheTag here — following the products/courses
// convention where caching lives at the page level, not the db layer.
export async function getQuestionsForLesson(lessonId: string) {
  return db.query.LessonQuestionTable.findMany({
    where: eq(LessonQuestionTable.lessonId, lessonId),
    with: {
      user: { columns: { id: true, name: true, image: true } },
      replies: {
        with: { user: { columns: { id: true, name: true, image: true } } },
        orderBy: (table, { asc }) => asc(table.createdAt),
      },
    },
    orderBy: (table, { desc }) => desc(table.createdAt),
  })
}
