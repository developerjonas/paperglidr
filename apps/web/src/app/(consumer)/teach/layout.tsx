import { redirect } from "next/navigation";
import { getCurrentUser } from "@/services/auth";
import { getInstructorByUserId } from "@/features/instructors/db/instructors";
import { CREATOR_TERMS_VERSION } from "@/config/company";

export default async function TeachLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user?.userId) redirect("/sign-in");

  const instructor = await getInstructorByUserId(user.userId);

  if (!instructor) {
    redirect("/instructors/onboarding?redirect=/teach");
  }
  // Creators who haven't accepted the current Creator Terms do so first.
  if (instructor.creatorTermsVersion !== CREATOR_TERMS_VERSION) {
    redirect("/instructors/onboarding?redirect=/teach#profile");
  }

  return <>{children}</>;
}
