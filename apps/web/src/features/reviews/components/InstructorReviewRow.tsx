"use client";
import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { actionToast } from "@/hooks/use-toast";
import { StarRatingDisplay } from "./StarRatingDisplay";
import { replyToReview, deleteReply } from "../actions/reviews";

export function InstructorReviewRow({
  review,
}: {
  review: {
    id: string;
    rating: number;
    content: string | null;
    instructorReply: string | null;
    createdAt: Date;
    isHidden: boolean;
    user: { name: string; image: string | null };
    course: { id: string; name: string };
  };
}) {
  const [isReplying, setIsReplying] = useState(false);
  const [replyText, setReplyText] = useState(review.instructorReply ?? "");

  async function submitReply() {
    const data = await replyToReview(review.id, replyText);
    actionToast({ actionData: data });
    if (!data.error) setIsReplying(false);
  }

  async function removeReply() {
    const data = await deleteReply(review.id);
    actionToast({ actionData: data });
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-2 space-y-0">
        <div>
          <div className="text-sm text-muted-foreground">
            {review.course.name}
          </div>
          <div className="font-medium">{review.user.name}</div>
          <StarRatingDisplay rating={review.rating} size={14} />
        </div>
        <div className="flex items-center gap-2">
          {review.isHidden && (
            <span className="text-xs rounded bg-muted px-2 py-1 text-muted-foreground">
              Hidden by admin
            </span>
          )}
          <span className="text-xs text-muted-foreground">
            {review.createdAt.toLocaleDateString()}
          </span>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {review.content && <p className="text-sm">{review.content}</p>}

        {review.instructorReply && !isReplying ? (
          <div className="rounded-md bg-muted p-3 text-sm flex flex-col gap-2">
            <div className="font-medium">Your response</div>
            <p className="text-muted-foreground">{review.instructorReply}</p>
            <div className="flex gap-2 self-end">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsReplying(true)}
              >
                Edit
              </Button>
              <Button
                size="sm"
                variant="destructiveOutline"
                onClick={removeReply}
              >
                Remove
              </Button>
            </div>
          </div>
        ) : isReplying ? (
          <div className="flex flex-col gap-2">
            <Textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Write a public response..."
              rows={3}
            />
            <div className="flex gap-2 self-end">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsReplying(false)}
              >
                Cancel
              </Button>
              <Button size="sm" onClick={submitReply}>
                Post reply
              </Button>
            </div>
          </div>
        ) : (
          <Button
            size="sm"
            variant="outline"
            className="self-start"
            onClick={() => setIsReplying(true)}
          >
            Reply
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
