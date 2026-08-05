import { notFound } from "next/navigation";
import { getInstructorByHandle } from "@/features/instructors/db/instructors";
import { InstructorProfileCard } from "@/features/instructors/components/InstructorProfileCard";

export default async function InstructorProfilePage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const instructor = await getInstructorByHandle(handle);

  if (!instructor) notFound();

  return (
    <div className="container mx-auto max-w-3xl py-8">
      <InstructorProfileCard instructor={instructor} />
      {/* TODO: list published courses by this instructor once
          CourseTable has an instructorId FK */}
    </div>
  );
}
