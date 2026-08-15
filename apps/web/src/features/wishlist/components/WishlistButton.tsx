// Destination: apps/web/src/features/wishlist/components/WishlistButton.tsx
// Drop onto ProductCard.tsx and the product detail page. Pass
// initialIsWishlisted from a server-side isProductWishlisted() call
// (or false for signed-out users) so there's no flash on load.

"use client";

import { useState, useTransition } from "react";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { toggleWishlist } from "../actions/wishlist";

export function WishlistButton({
  productId,
  initialIsWishlisted,
  className,
}: {
  productId: string;
  initialIsWishlisted: boolean;
  className?: string;
}) {
  const [isWishlisted, setIsWishlisted] = useState(initialIsWishlisted);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  function handleClick(e: React.MouseEvent) {
    // Prevent this firing a parent <Link> navigation when used inside
    // a ProductCard.
    e.preventDefault();
    e.stopPropagation();

    const nextState = !isWishlisted;
    setIsWishlisted(nextState); // optimistic

    startTransition(async () => {
      const result = await toggleWishlist(productId);
      if (result.error) {
        setIsWishlisted(!nextState); // revert
        toast({ variant: "destructive", description: result.message });
        return;
      }
      setIsWishlisted(result.isWishlisted);
    });
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      onClick={handleClick}
      disabled={isPending}
      className={className}
      aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
      aria-pressed={isWishlisted}
    >
      <Heart
        className={cn(
          "h-4 w-4 transition-colors",
          isWishlisted && "fill-red-500 text-red-500",
        )}
      />
    </Button>
  );
}
