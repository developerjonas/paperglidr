import { notFound } from "next/navigation";
import {
  getInstructorByHandle,
  getInstructorPublishedCourses,
} from "@/features/instructors/db/instructors";
import { InstructorProfileCard } from "@/features/instructors/components/InstructorProfileCard";
import { InstructorCourseCard } from "@/features/instructors/components/InstructorCourseCard";

export default async function InstructorProfilePage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const instructor = await getInstructorByHandle(handle);
  if (!instructor) notFound();
  const courses = await getInstructorPublishedCourses(instructor.userId);

  const initial = (instructor.name || instructor.handle || "?")
    .charAt(0)
    .toUpperCase();

  return (
    <div className="flex flex-col min-h-screen">
      {/* ---------------- HERO ---------------- */}
      <section className="relative overflow-hidden section-muted border-b py-14 md:py-20">

        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-b from-primary to-primary/80 text-xl font-bold text-primary-foreground">
              {initial}
            </div>
            <div>
              <h1 className="heading-display text-3xl sm:text-4xl">
                {instructor.name}
              </h1>
              <p className="text-sm text-muted-foreground sm:text-base">
                @{instructor.handle}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- CONTENT ---------------- */}
      <section className="container mx-auto px-4 py-10">
        <div className="mx-auto flex max-w-3xl flex-col gap-6">
          <InstructorProfileCard instructor={instructor} />

          <div className="flex flex-col gap-4">
            <h2 className="text-lg font-semibold px-1">Courses</h2>

            {courses.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-secondary/40 p-8 text-center">
                <p className="text-sm text-muted-foreground">
                  This instructor hasn&apos;t published any courses yet.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {courses.map((course) => (
                  <InstructorCourseCard key={course.id} course={course} />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
