import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StarRatingDisplay } from "./StarRatingDisplay";

export function ReviewCard({
  review,
  isAuthenticated,
}: {
  review: {
    id: string;
    rating: number;
    content: string | null;
    createdAt: Date;
    updatedAt: Date;
    user: { name: string; image: string | null };
  };
  isAuthenticated: boolean;
}) {
  const wasEdited = review.updatedAt.getTime() !== review.createdAt.getTime();

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-2 space-y-0">
        <div>
          <div className="font-medium">{review.user.name}</div>
          <StarRatingDisplay rating={review.rating} size={14} />
        </div>
        <span className="text-xs text-muted-foreground">
          {review.createdAt.toLocaleDateString()}
          {wasEdited && " (edited)"}
        </span>
      </CardHeader>
      {review.content && (
        <CardContent>
          {isAuthenticated ? (
            <p className="text-sm text-muted-foreground">{review.content}</p>
          ) : (
            <div className="relative">
              <p className="text-sm text-muted-foreground blur-sm select-none">
                {review.content}
              </p>
              <div className="absolute inset-0 flex items-center justify-center">
                <Button asChild size="sm" variant="secondary">
                  <Link href="/sign-in">Sign in to read this review</Link>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
