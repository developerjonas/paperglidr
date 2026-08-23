// apps/web/src/app/api/v1/lessons/[lessonId]/complete/route.ts
import { NextResponse } from "next/server"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { toTypedSession } from "@/lib/session-types"
import { getLessonForViewer } from "@/features/lessons/db/lessons"
import { canViewLesson } from "@/features/lessons/permissions/lessons"
import { updateLessonCompleteStatus } from "@/features/lessons/db/userLessonComplete"

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ lessonId: string }> },
) {
  const rawSession = await auth.api.getSession({ headers: await headers() })
  if (!rawSession) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }
  const session = toTypedSession(rawSession)

  const { lessonId } = await params

  // canViewLesson needs the lesson's status to decide access, so fetch
  // before gating — same as the GET route.
  const lesson = await getLessonForViewer(lessonId)
  if (!lesson) {
    return NextResponse.json({ message: "Lesson not found" }, { status: 404 })
  }

  const allowed = await canViewLesson(
    { userId: session.user.id, role: session.user.role },
    { id: lesson.id, status: lesson.status },
  )
  if (!allowed) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 })
  }

  await updateLessonCompleteStatus({
    lessonId,
    userId: session.user.id,
    complete: true,
  })

  return NextResponse.json({ ok: true })
}
