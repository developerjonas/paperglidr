// apps/web/src/app/api/v1/courses/route.ts
import { NextResponse } from "next/server"
import { getPublicCourseListings } from "@/features/courses/db/courses"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const limitParam = searchParams.get("limit")
  const limit = limitParam ? Number(limitParam) : undefined

  const courses = await getPublicCourseListings({ limit })
  return NextResponse.json(courses)
}
