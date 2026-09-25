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
      <section className="relative overflow-hidden section-muted border-b py-14 md:py-20">
        <div className="container mx-auto px-4">
          <h1 className="heading-display text-3xl sm:text-4xl">
            Course Reviews
          </h1>
        </div>
      </section>

      {/* ---------------- CONTENT ---------------- */}
      <section className="container mx-auto px-4 py-10">
        {reviews.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border bg-secondary/40 p-10 text-center">
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
