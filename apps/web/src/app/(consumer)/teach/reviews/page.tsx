import { getCurrentUser } from "@/services/auth";
import { getReviewsForInstructor } from "@/features/reviews/db/reviews";
import { InstructorReviewRow } from "@/features/reviews/components/InstructorReviewRow";

export default async function InstructorReviewsPage() {
  const { userId, role, redirectToSignIn } = await getCurrentUser();
  if (!userId) return redirectToSignIn();

  const reviews = await getReviewsForInstructor({ userId, role });

  return (
    <div className="flex flex-col min-h-screen">
      {/* ---------------- HERO ---------------- */}
      <section className="relative overflow-hidden border-b border-white/10 bg-gradient-to-b from-primary/5 via-background to-background py-14 md:py-20">
        <div className="absolute top-0 left-1/2 -z-10 h-[280px] w-[480px] -translate-x-1/2 rounded-full bg-primary/10 blur-[120px]" />
        <div className="container mx-auto px-4">
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
            Course Reviews
          </h1>
        </div>
      </section>

      {/* ---------------- CONTENT ---------------- */}
      <section className="container mx-auto px-4 py-10">
        {reviews.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-white/30 bg-white/30 p-10 text-center backdrop-blur-md dark:border-white/10 dark:bg-white/[0.02]">
            <p className="text-sm text-muted-foreground">
              No reviews yet on your courses.
            </p>
          </div>
        ) : (
          <div className="mx-auto flex max-w-2xl flex-col gap-4">
            {reviews.map((review) => (
              <InstructorReviewRow key={review.id} review={review} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
