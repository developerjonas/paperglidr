"use client";
import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function StarRatingInput({
  value,
  onChange,
  size = 24,
}: {
  value: number;
  onChange: (value: number) => void;
  size?: number;
}) {
  const [hovered, setHovered] = useState<number | null>(null);
  const active = hovered ?? value;

  return (
    <div className="flex" onMouseLeave={() => setHovered(null)}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onMouseEnter={() => setHovered(star)}
          onClick={() => onChange(star)}
          className="p-0.5"
          aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
        >
          <Star
            size={size}
            className={cn(
              "transition-colors",
              star <= active
                ? "fill-yellow-500 text-yellow-500"
                : "fill-transparent text-muted-foreground/40",
            )}
          />
        </button>
      ))}
    </div>
  );
}
