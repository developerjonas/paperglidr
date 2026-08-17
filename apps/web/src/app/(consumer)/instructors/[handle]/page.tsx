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
      <section className="relative overflow-hidden border-b border-white/10 bg-gradient-to-b from-primary/5 via-background to-background py-14 md:py-20">
        <div className="absolute top-0 left-1/2 -z-10 h-[280px] w-[480px] -translate-x-1/2 rounded-full bg-primary/10 blur-[120px]" />

        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-b from-primary to-primary/80 text-xl font-bold text-primary-foreground shadow-[inset_0_1px_0_0_rgba(255,255,255,0.3)]">
              {initial}
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
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
              <div className="rounded-2xl border border-dashed border-white/30 bg-white/30 p-8 text-center backdrop-blur-md dark:border-white/10 dark:bg-white/[0.02]">
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
        </div>ß
      </section>
    </div>
  );
}
