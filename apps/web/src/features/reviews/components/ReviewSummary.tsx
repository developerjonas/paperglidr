import { StarRatingDisplay } from "./StarRatingDisplay";

export function ReviewSummary({
  averageRating,
  reviewCount,
}: {
  averageRating: number;
  reviewCount: number;
}) {
  if (reviewCount === 0)
    return <p className="text-sm text-muted-foreground">No reviews yet</p>;

  return (
    <div className="flex items-center gap-2">
      <StarRatingDisplay rating={averageRating} size={20} />
      <span className="font-medium">{averageRating.toFixed(1)}</span>
      <span className="text-sm text-muted-foreground">
        ({reviewCount} review{reviewCount === 1 ? "" : "s"})
      </span>
    </div>
  );
}
