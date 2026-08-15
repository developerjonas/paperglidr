import { Star } from "lucide-react";

export function StarRatingDisplay({
  rating,
  size = 16,
}: {
  rating: number;
  size?: number;
}) {
  const percent = (Math.max(0, Math.min(5, rating)) / 5) * 100;

  return (
    <div
      className="relative inline-flex"
      style={{ width: size * 5, height: size }}
    >
      <div className="flex text-muted-foreground/30">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} size={size} className="fill-current shrink-0" />
        ))}
      </div>
      <div
        className="absolute inset-0 flex overflow-hidden text-yellow-500"
        style={{ width: `${percent}%` }}
      >
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} size={size} className="fill-current shrink-0" />
        ))}
      </div>
    </div>
  );
}
