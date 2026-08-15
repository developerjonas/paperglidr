import { PageHeader } from "@/components/PageHeader";
import { getCurrentUser } from "@/services/clerk";
import { getReviewsForInstructor } from "@/features/reviews/db/reviews";
import { InstructorReviewRow } from "@/features/reviews/components/InstructorReviewRow";

export default async function InstructorReviewsPage() {
  const { userId, role, redirectToSignIn } = await getCurrentUser();
  if (!userId) return redirectToSignIn();

  const reviews = await getReviewsForInstructor({ userId, role });

  return (
    <div className="container my-6 flex flex-col gap-6">
      <PageHeader title="Course Reviews" />
      {reviews.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No reviews yet on your courses.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {reviews.map((review) => (
            <InstructorReviewRow key={review.id} review={review} />
          ))}
        </div>
      )}
    </div>
  );
}
