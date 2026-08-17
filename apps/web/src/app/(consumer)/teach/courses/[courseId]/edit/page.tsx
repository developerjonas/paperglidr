import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { db } from "@/drizzle/db";
import { CourseSectionTable, CourseTable, LessonTable } from "@/drizzle/schema";
import { CourseForm } from "@/features/courses/components/CourseForm";
import { getCourseIdTag } from "@/features/courses/db/cache/courses";
import { SectionFormDialog } from "@/features/courseSections/components/SectionFormDialog";
import { SortableSectionList } from "@/features/courseSections/components/SortableSectionList";
import { getCourseSectionCourseTag } from "@/features/courseSections/db/cache";
import { LessonFormDialog } from "@/features/lessons/components/LessonFormDialog";
import { SortableLessonList } from "@/features/lessons/components/SortableLessonList";
import { getLessonCourseTag } from "@/features/lessons/db/cache/lessons";
import { cn } from "@/lib/utils";
import { asc, eq } from "drizzle-orm";
import { EyeClosed, PlusIcon } from "lucide-react";
import { cacheTag } from "next/dist/server/use-cache/cache-tag";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/services/auth";

export default async function EditCoursePage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const { userId, redirectToSignIn } = await getCurrentUser();
  if (userId == null) return redirectToSignIn();

  const course = await getCourse(courseId);

  if (course == null) return notFound();
  if (course.authorId !== userId) return notFound(); // don't leak that the course exists to non-owners

  return (
    <div className="flex flex-col min-h-screen">
      {/* ---------------- HERO ---------------- */}
      <section className="relative overflow-hidden border-b border-white/10 bg-gradient-to-b from-primary/5 via-background to-background py-14 md:py-20">
        <div className="absolute top-0 left-1/2 -z-10 h-[280px] w-[480px] -translate-x-1/2 rounded-full bg-primary/10 blur-[120px]" />

        <div className="container mx-auto px-4">
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl text-balance">
            {course.name}
          </h1>
        </div>
      </section>

      {/* ---------------- CONTENT ---------------- */}
      <section className="container mx-auto px-4 py-10">
        <Tabs defaultValue="lessons">
          <TabsList className="border border-white/30 bg-white/40 backdrop-blur-md dark:border-white/10 dark:bg-white/[0.03]">
            <TabsTrigger value="lessons">Lessons</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
          </TabsList>

          <TabsContent value="lessons" className="flex flex-col gap-4 mt-4">
            <Card className="border-white/30 bg-white/60 shadow-sm backdrop-blur-2xl backdrop-saturate-150 dark:border-white/10 dark:bg-black/40">
              <CardHeader className="flex items-center flex-row justify-between">
                <CardTitle className="text-lg">Sections</CardTitle>
                <SectionFormDialog courseId={course.id}>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <PlusIcon /> New Section
                    </Button>
                  </DialogTrigger>
                </SectionFormDialog>
              </CardHeader>
              <CardContent>
                <SortableSectionList
                  courseId={course.id}
                  sections={course.courseSections}
                />
              </CardContent>
            </Card>

            <div className="flex flex-col gap-4">
              {course.courseSections.map((section) => (
                <Card
                  key={section.id}
                  className="border-white/30 bg-white/60 shadow-sm backdrop-blur-2xl backdrop-saturate-150 dark:border-white/10 dark:bg-black/40"
                >
                  <CardHeader className="flex items-center flex-row justify-between gap-4">
                    <CardTitle
                      className={cn(
                        "flex items-center gap-2 text-lg",
                        section.status === "private" && "text-muted-foreground",
                      )}
                    >
                      {section.status === "private" && <EyeClosed />}{" "}
                      {section.name}
                    </CardTitle>
                    <LessonFormDialog
                      defaultSectionId={section.id}
                      sections={course.courseSections}
                    >
                      <DialogTrigger asChild>
                        <Button variant="outline">
                          <PlusIcon /> New Lesson
                        </Button>
                      </DialogTrigger>
                    </LessonFormDialog>
                  </CardHeader>
                  <CardContent>
                    <SortableLessonList
                      sections={course.courseSections}
                      lessons={section.lessons}
                    />
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="details" className="mt-4">
            <Card className="border-white/30 bg-white/60 shadow-sm backdrop-blur-2xl backdrop-saturate-150 dark:border-white/10 dark:bg-black/40">
              <CardContent className="pt-6">
                <CourseForm course={course} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </section>
    </div>
  );
}

async function getCourse(id: string) {
  "use cache";
  cacheTag(
    getCourseIdTag(id),
    getCourseSectionCourseTag(id),
    getLessonCourseTag(id),
  );

  return db.query.CourseTable.findFirst({
    columns: { id: true, name: true, description: true, authorId: true },
    where: eq(CourseTable.id, id),
    with: {
      courseSections: {
        orderBy: asc(CourseSectionTable.order),
        columns: { id: true, status: true, name: true, order: true },
        with: {
          lessons: {
            orderBy: asc(LessonTable.order),
            columns: {
              id: true,
              name: true,
              status: true,
              description: true,
              sectionId: true,
              order: true,
            },
          },
        },
      },
    },
  });
}
