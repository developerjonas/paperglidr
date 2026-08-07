import { notFound } from "next/navigation"
import { getInstructorByHandle, getInstructorPublishedCourses } from "@/features/instructors/db/instructors"
import { InstructorProfileCard } from "@/features/instructors/components/InstructorProfileCard"
import { InstructorCourseCard } from "@/features/instructors/components/InstructorCourseCard"

export default async function InstructorProfilePage({
  params,
}: {
  params: Promise<{ handle: string }>
}) {
  const { handle } = await params
  const instructor = await getInstructorByHandle(handle)
  if (!instructor) notFound()

  const courses = await getInstructorPublishedCourses(instructor.userId)

  return (
    <div className="container mx-auto max-w-3xl py-8 flex flex-col gap-8">
      <InstructorProfileCard instructor={instructor} />

      <div className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold">Courses</h2>
        {courses.length === 0 ? (
          <p className="text-muted-foreground">This instructor hasn&apos;t published any courses yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {courses.map(course => (
              <InstructorCourseCard key={course.id} course={course} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
