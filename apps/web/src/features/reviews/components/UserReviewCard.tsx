"use client";
import { Button } from "@/components/ui/button";
import { ActionButton } from "@/components/ActionButton";
import { DialogTrigger } from "@/components/ui/dialog";
import { Trash2Icon } from "lucide-react";
import { StarRatingDisplay } from "./StarRatingDisplay";
import { ReviewFormDialog } from "./ReviewFormDialog";
import { deleteReview } from "../actions/reviews";

export function UserReviewCard({
  courseId,
  review,
}: {
  courseId: string;
  review: { id: string; rating: number; content: string | null };
}) {
  return (
    <div className="rounded-lg border p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">
          Your review
        </span>
        <div className="flex gap-2">
          <ReviewFormDialog courseId={courseId} review={review}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                Edit
              </Button>
            </DialogTrigger>
          </ReviewFormDialog>
          <ActionButton
            action={deleteReview.bind(null, review.id)}
            requireAreYouSure
            variant="destructiveOutline"
            size="sm"
          >
            <Trash2Icon />
            <span className="sr-only">Delete</span>
          </ActionButton>
        </div>
      </div>
      <StarRatingDisplay rating={review.rating} size={16} />
      {review.content && <p className="text-sm">{review.content}</p>}
    </div>
  );
}
