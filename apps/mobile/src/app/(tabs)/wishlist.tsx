import { PlaceholderScreen } from '@/components/placeholder-screen';

export default function WishlistScreen() {
  return (
    <PlaceholderScreen
      title="Wishlist"
      description="Products you saved."
      api="GET /api/v1/wishlist · DELETE /wishlist/:productId"
      links={[
        { label: "A saved product", href: "/products/sample" },
      ]}
    />
  );
}
