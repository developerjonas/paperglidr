import { PageHeader } from "@/components/PageHeader";
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
    <div className="my-6 container flex flex-col gap-8">
      <div>
        <PageHeader className="mb-2" title={course.name} />
        <p className="text-muted-foreground">{course.description}</p>
      </div>
      <CourseReviews courseId={course.id} />
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
