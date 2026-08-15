import Link from "next/link";
import { getCurrentUser } from "@/services/clerk";
import {
  getCourseReviewSummary,
  getReviewsForCourse,
  getUserReviewForCourse,
} from "../db/reviews";
import {
  canCreateCourseReview,
  getUserCourseCompletionPercent,
} from "../permissions/reviews";
import { ReviewSummary } from "./ReviewSummary";
import { ReviewCard } from "./ReviewCard";
import { UserReviewCard } from "./UserReviewCard";
import { ReviewFormDialog } from "./ReviewFormDialog";
import { DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export async function CourseReviews({ courseId }: { courseId: string }) {
  const { userId } = await getCurrentUser();
  const [summary, reviews] = await Promise.all([
    getCourseReviewSummary(courseId),
    getReviewsForCourse(courseId),
  ]);

  const userReview = userId
    ? await getUserReviewForCourse(userId, courseId)
    : null;
  const otherReviews = reviews.filter((r) => r.userId !== userId);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Reviews</h2>
        <ReviewSummary
          averageRating={summary.averageRating}
          reviewCount={summary.reviewCount}
        />
      </div>

      {userId == null && (
        <p className="text-sm text-muted-foreground">
          <Link href="/sign-in" className="underline">
            Sign in
          </Link>{" "}
          to write a review.
        </p>
      )}

      {userId != null && userReview != null && (
        <UserReviewCard courseId={courseId} review={userReview} />
      )}
      {userId != null && userReview == null && (
        <WriteReviewPrompt userId={userId} courseId={courseId} />
      )}

      <div className="flex flex-col gap-4">
        {otherReviews.map((review) => (
          <ReviewCard
            key={review.id}
            review={review}
            isAuthenticated={userId != null}
          />
        ))}
        {otherReviews.length === 0 && userReview == null && (
          <p className="text-sm text-muted-foreground">
            No reviews yet — be the first!
          </p>
        )}
      </div>
    </div>
  );
}

async function WriteReviewPrompt({
  userId,
  courseId,
}: {
  userId: string;
  courseId: string;
}) {
  const eligible = await canCreateCourseReview({ userId }, courseId);

  if (!eligible) {
    const percent = await getUserCourseCompletionPercent(userId, courseId);
    return (
      <p className="text-sm text-muted-foreground">
        Complete at least 50% of the course to leave a review
        {percent > 0 && ` (you're at ${Math.round(percent * 100)}%)`}.
      </p>
    );
  }

  return (
    <ReviewFormDialog courseId={courseId}>
      <DialogTrigger asChild>
        <Button variant="outline">Write a review</Button>
      </DialogTrigger>
    </ReviewFormDialog>
  );
}
