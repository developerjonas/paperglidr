// apps/web/src/app/api/v1/lessons/[lessonId]/route.ts
import { NextResponse } from "next/server"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { toTypedSession } from "@/lib/session-types"
import { getLessonForViewer } from "@/features/lessons/db/lessons"
import { canViewLesson } from "@/features/lessons/permissions/lessons"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ lessonId: string }> },
) {
  const rawSession = await auth.api.getSession({ headers: await headers() })
  if (!rawSession) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }
  const session = toTypedSession(rawSession)

  const { lessonId } = await params

  const lesson = await getLessonForViewer(lessonId)
  if (!lesson) {
    return NextResponse.json({ message: "Lesson not found" }, { status: 404 })
  }

  const allowed = await canViewLesson(
    { userId: session.user.id, role: session.user.role }, // role is now UserRole, not string — TS2322 gone
    { id: lesson.id, status: lesson.status },
  )
  if (!allowed) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 })
  }

  return NextResponse.json(lesson)
}
