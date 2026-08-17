// Destination: apps/web/src/features/products/components/ProductCard.tsx
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatPrice } from "@/lib/formatters";
import { WishlistButton } from "@/features/wishlist/components/WishlistButton";
import { StarIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";

export function ProductCard({
  id,
  imageUrl,
  name,
  priceInRupees,
  description,
  isWishlisted = false,
  avgRating,
  reviewCount,
}: {
  id: string;
  imageUrl: string;
  name: string;
  priceInRupees: number;
  description: string;
  isWishlisted?: boolean;
  avgRating?: number;
  reviewCount?: number;
}) {
  const hasRating = avgRating !== undefined && !!reviewCount && reviewCount > 0;

  return (
    <Card className="group overflow-hidden flex flex-col w-full max-w-[500px] mx-auto border-white/30 bg-white/60 shadow-sm backdrop-blur-2xl backdrop-saturate-150 transition-transform hover:-translate-y-0.5 dark:border-white/10 dark:bg-black/40 pt-0 gap-0">
      <div className="relative aspect-video w-full overflow-hidden">
        <Image
          src={imageUrl}
          alt={name}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <WishlistButton
          productId={id}
          initialIsWishlisted={isWishlisted}
          className="absolute top-2 right-2 rounded-full border border-white/30 bg-white/70 backdrop-blur-md hover:bg-white/90 dark:border-white/10 dark:bg-black/50 dark:hover:bg-black/70"
        />
      </div>

      <CardHeader className="space-y-0 pt-4">
        <div className="flex items-center justify-between gap-2">
          <CardDescription className="text-sm">
            <Suspense fallback={formatPrice(priceInRupees)}>
              <Price price={priceInRupees} />
            </Suspense>
          </CardDescription>
          {hasRating && (
            <div className="flex items-center gap-1 rounded-[4px] bg-white/40 px-1.5 py-0.5 text-xs text-muted-foreground dark:bg-white/[0.05]">
              <StarIcon className="size-3.5 fill-amber-400 text-amber-400" />
              <span className="font-medium text-foreground">
                {avgRating.toFixed(1)}
              </span>
              <span>({reviewCount})</span>
            </div>
          )}
        </div>
        <CardTitle className="text-lg leading-snug">{name}</CardTitle>
      </CardHeader>

      <CardContent>
        <p className="line-clamp-3 text-sm text-muted-foreground">
          {description}
        </p>
      </CardContent>

      <CardFooter className="mt-auto pt-2">
        <Button className="w-full" asChild>
          <Link href={`/products/${id}`}>View Course</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

async function Price({ price }: { price: number }) {
  if (price === 0) {
    return formatPrice(price);
  }
  return (
    <div className="flex gap-2 items-baseline">
      <div className="line-through text-xs opacity-50">
        {formatPrice(price)}
      </div>
      <div className="font-medium text-foreground">{formatPrice(price)}</div>
    </div>
  );
}
