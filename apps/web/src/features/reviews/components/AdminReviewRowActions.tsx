"use client";
import { ActionButton } from "@/components/ActionButton";
import { Eye, EyeOff } from "lucide-react";
import { hideReview } from "../actions/reviews";

export function AdminReviewRowActions({
  reviewId,
  isHidden,
}: {
  reviewId: string;
  isHidden: boolean;
}) {
  return (
    <ActionButton
      action={hideReview.bind(null, reviewId, !isHidden)}
      variant="outline"
      size="sm"
    >
      {isHidden ? (
        <Eye className="mr-2 h-4 w-4" />
      ) : (
        <EyeOff className="mr-2 h-4 w-4" />
      )}
      {isHidden ? "Unhide" : "Hide"}
    </ActionButton>
  );
}
