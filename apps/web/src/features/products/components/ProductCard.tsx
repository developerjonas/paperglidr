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
    <Card className="group overflow-hidden flex flex-col w-full max-w-[500px] mx-auto border-border bg-card shadow-sm transition-transform hover:-translate-y-0.5 pt-0 gap-0">
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
          className="absolute top-2 right-2 rounded-full border border-border bg-card hover:bg-accent"
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
            <div className="flex items-center gap-1 rounded-md bg-secondary/60 px-1.5 py-0.5 text-xs text-muted-foreground">
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
