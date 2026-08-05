import { redirect } from "next/navigation";
import { getCurrentUser } from "@/services/clerk";
import { getInstructorByUserId } from "@/features/instructors/db/instructors";

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

  return <>{children}</>;
}
