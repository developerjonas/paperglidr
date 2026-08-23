// apps/web/src/app/api/v1/me/courses/route.ts
import { NextResponse } from "next/server"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { getCoursesForUser } from "@/features/courses/db/courses"

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }
  const courses = await getCoursesForUser(session.user.id)
  return NextResponse.json(courses)
}
