// apps/web/src/app/api/v1/instructors/[handle]/route.ts
import { NextResponse } from "next/server"
import { getPublicInstructorByHandle } from "@/features/instructors/db/instructors"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ handle: string }> }
) {
  const { handle } = await params
  const instructor = await getPublicInstructorByHandle(handle)
  if (!instructor) {
    return NextResponse.json({ message: "Instructor not found" }, { status: 404 })
  }
  return NextResponse.json(instructor)
}
