// Destination: apps/web/src/features/products/components/ProductCard.tsx
// Added: WishlistButton as an absolute-positioned overlay on the thumbnail
// (top-right corner), plus a new isWishlisted prop. Wishlist status is
// fetched by the caller (wherever ProductCard is rendered — /browse,
// /wishlist, etc.) and passed down, same as name/priceInRupees/etc.,
// rather than each card doing its own async lookup.

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
}: {
  id: string;
  imageUrl: string;
  name: string;
  priceInRupees: number;
  description: string;
  isWishlisted?: boolean;
}) {
  return (
    <Card className="overflow-hidden flex flex-col w-full max-w-[500px] mx-auto">
      <div className="relative aspect-video w-full">
        <Image src={imageUrl} alt={name} fill className="object-cover" />
        <WishlistButton
          productId={id}
          initialIsWishlisted={isWishlisted}
          className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm hover:bg-background"
        />
      </div>
      <CardHeader className="space-y-0">
        <CardDescription>
          <Suspense fallback={formatPrice(priceInRupees)}>
            <Price price={priceInRupees} />
          </Suspense>
        </CardDescription>
        <CardTitle className="text-xl">{name}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="line-clamp-3">{description}</p>
      </CardContent>
      <CardFooter className="mt-auto">
        <Button className="w-full text-md py-y" asChild>
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
      <div>{formatPrice(price)}</div>
    </div>
  );
}
