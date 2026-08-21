// apps/web/src/app/api/v1/courses/[courseId]/route.ts
import { NextResponse } from "next/server";
import { getPublicCourseDetail } from "@/features/courses/db/courses";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ courseId: string }> },
) {
  const { courseId } = await params;
  const course = await getPublicCourseDetail(courseId);
  if (!course) {
    return NextResponse.json({ message: "Course not found" }, { status: 404 });
  }
  return NextResponse.json(course);
}
