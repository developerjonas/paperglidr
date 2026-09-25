import { z } from "zod"
import { actionResponse, apiError, apiJson, isUuid, readJson, requireApiUser, v1Route } from "@/lib/api/v1"
import { askLessonQuestion } from "@/features/lessonQuestions/actions/lessonQuestions"
import { askQuestionSchema } from "@/features/lessonQuestions/schemas/lessonQuestions"
import { getQuestionsForLesson } from "@/features/lessonQuestions/db/lessonQuestions"
import { getLessonCourseContext } from "@/features/lessonQuestions/lib/lessonAccess"
import { canAccessLessonContent } from "@/features/lessons/permissions/lessons"

type Params = { lessonId: string }

/**
 * The lesson's Q&A, newest question first, replies oldest first. Readable
 * by anyone who can open the lesson. People are shown by name and photo;
 * `isMine` marks the viewer's own posts and `isInstructor` the course
 * author's replies.
 */
export const GET = v1Route<Params>("lesson questions", async (_req, { params }) => {
  const gate = await requireApiUser()
  if (!gate.ok) return gate.response
  const { lessonId } = await params
  if (!isUuid(lessonId)) return apiError(404, "Lesson not found")

  const access = await canAccessLessonContent(gate.user, lessonId)
  if (!access.allowed) {
    return access.reason === "not_found"
      ? apiError(404, "Lesson not found")
      : apiError(403, "Buy this course to see its questions")
  }

  const [questions, context] = await Promise.all([
    getQuestionsForLesson(lessonId),
    getLessonCourseContext(lessonId),
  ])
  const person = (user: { id: string; name: string; image: string | null }) => ({
    name: user.name,
    image: user.image,
    isMine: user.id === gate.user.userId,
    isInstructor: user.id === context?.courseAuthorId,
  })

  return apiJson(
    questions.map(question => ({
      id: question.id,
      body: question.body,
      createdAt: question.createdAt,
      author: person(question.user),
      replies: question.replies.map(reply => ({
        id: reply.id,
        body: reply.body,
        createdAt: reply.createdAt,
        author: person(reply.user),
      })),
    })),
  )
})

/** Ask a question (buyers of the course only). Body: { body } — 10 to 2000 characters. */
export const POST = v1Route<Params>("ask lesson question", async (req, { params }) => {
  const gate = await requireApiUser()
  if (!gate.ok) return gate.response
  const { lessonId } = await params
  if (!isUuid(lessonId)) return apiError(404, "Lesson not found")

  // Validated here too, so a too-short question is a 400 with the reason.
  const input = await readJson(req, z.object({ body: askQuestionSchema.shape.body }))
  if (!input.ok) return input.response

  const result = await askLessonQuestion(lessonId, { body: input.data.body })
  return actionResponse(result, { errorStatus: 403, successStatus: 201 })
})
