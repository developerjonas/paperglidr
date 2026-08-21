// apps/web/src/app/api/v1/courses/route.ts
import { NextResponse } from "next/server"
import { getPublicCourseListings } from "@/features/courses/db/courses"

export async function GET() {
  const courses = await getPublicCourseListings()
  return NextResponse.json(courses)
}
