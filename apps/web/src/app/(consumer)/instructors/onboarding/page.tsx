import { POLICY_TERMS } from "@/config/policyTerms";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/services/auth";
import { getInstructorByUserId } from "@/features/instructors/db/instructors";
import { InstructorForm } from "@/features/instructors/components/InstructorForm";
import { PhoneVerificationForm } from "@/features/instructors/components/PhoneVerificationForm";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldCheckIcon, UserIcon } from "lucide-react";

export default async function InstructorOnboardingPage() {
  const user = await getCurrentUser();
  if (!user?.userId) redirect("/sign-in");
  const instructor = await getInstructorByUserId(user.userId);

  return (
    <div className="flex flex-col min-h-screen">
      {/* ---------------- HERO ---------------- */}
      <section className="relative overflow-hidden section-muted border-b py-14 md:py-20">

        <div className="container mx-auto px-4">
          <h1 className="heading-display text-3xl sm:text-4xl">
            Set up your creator profile
          </h1>
          <p className="mt-2 max-w-lg text-sm text-muted-foreground sm:text-base">
            A few details before you can start teaching on Paperglidr.
          </p>
        </div>
      </section>

      {/* ---------------- CONTENT ---------------- */}
      <section className="container mx-auto px-4 py-10">
        <div className="mx-auto flex max-w-xl flex-col gap-6">
          {/* ---- Creator profile ---- */}
          <Card
            id="profile"
            className="scroll-mt-24 border-border bg-card shadow-sm"
          >
            <CardHeader>
              <div className="flex items-center gap-2">
                <UserIcon className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-lg">Creator profile</CardTitle>
              </div>
              <CardDescription>
                This is what learners will see on your public instructor page.
              </CardDescription>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>

          {/* ---- Phone verification ---- */}
          {instructor && (
            <Card
              id="verify"
              className="scroll-mt-24 border-border bg-card shadow-sm"
            >
              <CardHeader>
                <div className="flex items-center gap-2">
                  <ShieldCheckIcon className="h-4 w-4 text-muted-foreground" />
                  <CardTitle className="text-lg">Verify your phone</CardTitle>
                  {instructor.phoneVerifiedAt ? (
                    <Badge
                      variant="secondary"
                      className="rounded-md px-1.5 py-0 text-[9px]"
                    >
                      Verified
                    </Badge>
                  ) : (
                    <Badge
                      variant="secondary"
                      className="rounded-md px-1.5 py-0 text-[9px]"
                    >
                      {POLICY_TERMS.payoutRequiresVerifiedPhone
                        ? "Required for payouts"
                        : "Optional"}
                    </Badge>
                  )}
                </div>
                <CardDescription>
                  {POLICY_TERMS.payoutRequiresVerifiedPhone
                    ? "You can publish without it, but you need a verified phone to request payouts. Verifying also raises how many products you can have on sale at once."
                    : "Optional. Verifying your phone raises how many products you can have on sale at once."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PhoneVerificationForm
                  phoneVerifiedAt={instructor.phoneVerifiedAt}
                />
              </CardContent>
            </Card>
          )}
        </div>
      </section>
    </div>
  );
}
