import { redirect } from "next/navigation";
import { getCurrentUser } from "@/services/clerk";
import { getInstructorByUserId } from "@/features/instructors/db/instructors";
import { InstructorForm } from "@/features/instructors/components/InstructorForm";
import { PageHeader } from "@/components/PageHeader";

export default async function InstructorOnboardingPage() {
  const user = await getCurrentUser();
  if (!user?.userId) redirect("/sign-in");


  const instructor = await getInstructorByUserId(user.userId);

  return (
    <div className="container mx-auto max-w-xl py-8">
      <PageHeader title="Set up your creator profile" />
      <InstructorForm
        defaultValues={
          instructor
            ? {
                handle: instructor.handle,
                name: instructor.name,
                bio: instructor.bio,
                profileImageUrl: instructor.profileImageUrl,
              }
            : undefined
        }
      />
    </div>
  );
}
