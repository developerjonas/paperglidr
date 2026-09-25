"use client";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CheckCircle2Icon, VideoIcon } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

export function CoursePageClient({
  course,
}: {
  course: {
    id: string;
    courseSections: {
      id: string;
      name: string;
      lessons: {
        id: string;
        name: string;
        isComplete: boolean;
      }[];
    }[];
  };
}) {
  const { lessonId } = useParams();
  const defaultValue =
    typeof lessonId === "string"
      ? course.courseSections.find((section) =>
          section.lessons.find((lesson) => lesson.id === lessonId),
        )
      : course.courseSections[0];

  return (
    <Accordion
      type="multiple"
      defaultValue={defaultValue ? [defaultValue.id] : undefined}
      className="-mx-1"
    >
      {course.courseSections.map((section) => (
        <AccordionItem
          key={section.id}
          value={section.id}
          className="border-border"
        >
          <AccordionTrigger className="px-1 text-sm font-medium hover:no-underline">
            {section.name}
          </AccordionTrigger>
          <AccordionContent className="flex flex-col gap-0.5 px-1">
            {section.lessons.map((lesson) => (
              <Button
                variant="ghost"
                asChild
                key={lesson.id}
                className={cn(
                  "justify-start rounded-lg font-normal",
                  lesson.id === lessonId &&
                    "bg-card text-foreground",
                )}
              >
                <Link href={`/courses/${course.id}/lessons/${lesson.id}`}>
                  <VideoIcon className="size-4 shrink-0" />
                  <span className="truncate">{lesson.name}</span>
                  {lesson.isComplete && (
                    <CheckCircle2Icon className="ml-auto size-4 shrink-0 text-primary" />
                  )}
                </Link>
              </Button>
            ))}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
