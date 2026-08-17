import { CourseForm } from "@/features/courses/components/CourseForm";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function NewCoursePage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* ---------------- HERO ---------------- */}
      <section className="relative overflow-hidden border-b border-white/10 bg-gradient-to-b from-primary/5 via-background to-background py-14 md:py-20">
        <div className="absolute top-0 left-1/2 -z-10 h-[280px] w-[480px] -translate-x-1/2 rounded-full bg-primary/10 blur-[120px]" />

        <div className="container mx-auto px-4">
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
            New Course
          </h1>
        </div>
      </section>

      {/* ---------------- CONTENT ---------------- */}
      <section className="container mx-auto px-4 py-10">
        <div className="mx-auto max-w-2xl">
          <Card className="border-white/30 bg-white/60 shadow-sm backdrop-blur-2xl backdrop-saturate-150 dark:border-white/10 dark:bg-black/40">
            <CardHeader>
              <CardTitle className="text-lg">Course details</CardTitle>
              <CardDescription>
                Give your course a name and description to get started — you can
                add sections and lessons after.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CourseForm />
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
