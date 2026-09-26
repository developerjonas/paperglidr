import {
  SkeletonArray,
  SkeletonButton,
  SkeletonText,
} from "@/components/Skeleton";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatPlural } from "@/lib/formatters";
import { getCurrentUser } from "@/services/auth";
import Link from "next/link";
import { getUserCourses } from "@/features/courses/db/courses";
import { Suspense } from "react";

export default function CoursesPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* ---------------- HERO ---------------- */}
      <section className="relative overflow-hidden section-muted border-b py-14 md:py-20">

        <div className="container mx-auto px-4">
          <h1 className="heading-display text-3xl sm:text-4xl">
            My Courses
          </h1>
        </div>
      </section>

      {/* ---------------- CONTENT ---------------- */}
      <section className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <Suspense
            fallback={
              <SkeletonArray amount={3}>
                <SkeletonCourseCard />
              </SkeletonArray>
            }
          >
            <CourseGrid />
          </Suspense>
        </div>
      </section>
    </div>
  );
}

async function CourseGrid() {
  const { userId, redirectToSignIn } = await getCurrentUser();
  if (userId == null) return redirectToSignIn();

  const courses = await getUserCourses(userId);

  if (courses.length === 0) {
    return (
      <div className="col-span-full flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border bg-secondary/40 p-10 text-center">
        <p className="text-sm text-muted-foreground">
          You have no courses yet.
        </p>
        <Button asChild size="lg">
          <Link href="/">Browse Courses</Link>
        </Button>
      </div>
    );
  }

  return courses.map((course) => (
    <Card
      key={course.id}
      className="overflow-hidden flex flex-col border-border bg-card shadow-sm pb-0 gap-0"
    >
      <CardHeader>
        <CardTitle className="text-lg">{course.name}</CardTitle>
        <CardDescription>
          {formatPlural(course.sectionsCount, {
            plural: "sections",
            singular: "section",
          })}{" "}
          •{" "}
          {formatPlural(course.lessonsCount, {
            plural: "lessons",
            singular: "lesson",
          })}
        </CardDescription>
      </CardHeader>
      <CardContent
        className="line-clamp-3 text-sm text-muted-foreground"
        title={course.description}
      >
        {course.description}
      </CardContent>
      <div className="flex-grow" />
      <CardFooter className="pt-4">
        <Button asChild className="w-full">
          <Link href={`/courses/${course.id}`}>View Course</Link>
        </Button>
      </CardFooter>
      <div className="h-1.5 w-full bg-secondary/40">
        <div
          className="h-full bg-primary"
          style={{
            width: `${
              course.lessonsCount === 0
                ? 0
                : (course.lessonsComplete / course.lessonsCount) * 100
            }%`,
          }}
        />
      </div>
    </Card>
  ));
}

function SkeletonCourseCard() {
  return (
    <Card className="border-border bg-card shadow-sm">
      <CardHeader>
        <CardTitle>
          <SkeletonText className="w-3/4" />
        </CardTitle>
        <CardDescription>
          <SkeletonText className="w-1/2" />
        </CardDescription>
      </CardHeader>
      <CardContent>
        <SkeletonText rows={3} />
      </CardContent>
      <CardFooter>
        <SkeletonButton />
      </CardFooter>
    </Card>
  );
}
