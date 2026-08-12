import { Badge } from "@/components/ui/badge"
import { ReplyForm } from "@/features/lessonQuestions/components/ReplyForm"
import { formatDistanceToNow } from "date-fns" // ADJUST: confirm date-fns is the repo's date lib — never seen a date-formatting import elsewhere in this conversation

type QuestionUser = {
  id: string
  name: string | null // ADJUST: confirm UserTable actually has `name` — never seen user.ts
  image: string | null // ADJUST: same
}

type QuestionReply = {
  id: string
  questionId: string
  userId: string
  body: string
  createdAt: Date
  user: QuestionUser
}

type Question = {
  id: string
  lessonId: string
  userId: string
  body: string
  createdAt: Date
  user: QuestionUser
  replies: QuestionReply[]
}

export function QuestionThread({
  questions,
  courseAuthorId,
  canReply,
}: {
  questions: Question[]
  courseAuthorId: string
  currentUserId: string | undefined
  canReply: boolean
}) {
  if (questions.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No questions yet for this lesson. Be the first to ask.
      </p>
    )
  }

  return (
    <ul className="flex flex-col gap-6">
      {questions.map(question => (
        <li key={question.id} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium">
                {question.user.name ?? "Anonymous"}
              </span>
              <span className="text-muted-foreground">
                {formatDistanceToNow(question.createdAt, { addSuffix: true })}
              </span>
            </div>
            <p className="text-sm">{question.body}</p>
          </div>

          {question.replies.length > 0 && (
            <ul className="flex flex-col gap-3 pl-4 border-l">
              {question.replies.map(reply => {
                const isInstructor = reply.userId === courseAuthorId
                return (
                  <li key={reply.id} className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium">
                        {reply.user.name ?? "Anonymous"}
                      </span>
                      {isInstructor && (
                        <Badge variant="secondary">Instructor</Badge>
                      )}
                      <span className="text-muted-foreground">
                        {formatDistanceToNow(reply.createdAt, {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                    <p className="text-sm">{reply.body}</p>
                  </li>
                )
              })}
            </ul>
          )}

          {canReply && <ReplyForm questionId={question.id} />}
        </li>
      ))}
    </ul>
  )
}
