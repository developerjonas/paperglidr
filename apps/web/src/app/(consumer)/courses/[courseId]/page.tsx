import { db } from "@/drizzle/db";
import { CourseTable } from "@/drizzle/schema";
import { getCourseIdTag } from "@/features/courses/db/cache/courses";
import { CourseReviews } from "@/features/reviews/components/CourseReviews";
import { eq } from "drizzle-orm";
import { cacheTag } from "next/dist/server/use-cache/cache-tag";
import { notFound } from "next/navigation";

export default async function CoursePage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const course = await getCourse(courseId);
  if (course == null) return notFound();

  return (
    <div className="flex flex-col min-h-screen">
      {/* ---------------- HERO ---------------- */}
      <section className="relative overflow-hidden section-muted border-b py-14 md:py-20">

        <div className="container mx-auto px-4">
          <h1 className="heading-display text-3xl sm:text-4xl text-balance">
            {course.name}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base leading-relaxed text-pretty">
            {course.description}
          </p>
        </div>
      </section>

      {/* ---------------- CONTENT ---------------- */}
      <section className="container mx-auto px-4 py-10">
        <div className="mx-auto max-w-3xl">
          <CourseReviews courseId={course.id} />
        </div>
      </section>
    </div>
  );
}

async function getCourse(id: string) {
  "use cache";
  cacheTag(getCourseIdTag(id));
  return db.query.CourseTable.findFirst({
    columns: { id: true, name: true, description: true },
    where: eq(CourseTable.id, id),
  });
}
