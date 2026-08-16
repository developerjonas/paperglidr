import { redirect } from "next/navigation";
import { getCurrentUser } from "@/services/auth";
import { getInstructorByUserId } from "@/features/instructors/db/instructors";
import { InstructorForm } from "@/features/instructors/components/InstructorForm";
import { PhoneVerificationForm } from "@/features/instructors/components/PhoneVerificationForm";
import { PageHeader } from "@/components/PageHeader";

export default async function InstructorOnboardingPage() {
  const user = await getCurrentUser();
  if (!user?.userId) redirect("/sign-in");
  const instructor = await getInstructorByUserId(user.userId);

  return (
    <div className="container mx-auto max-w-xl py-8 flex flex-col gap-10">
      <div>
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

      {instructor && (
        <div>
          <PageHeader title="Verify your phone" />
          <PhoneVerificationForm phoneVerifiedAt={instructor.phoneVerifiedAt} />
        </div>
      )}
    </div>
  );
}
