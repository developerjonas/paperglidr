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
      <section className="relative overflow-hidden section-muted border-b py-14 md:py-20">

        <div className="container mx-auto px-4">
          <h1 className="heading-display text-3xl sm:text-4xl">
            New Course
          </h1>
        </div>
      </section>

      {/* ---------------- CONTENT ---------------- */}
      <section className="container mx-auto px-4 py-10">
        <div className="mx-auto max-w-2xl">
          <Card className="border-border bg-card shadow-sm">
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
