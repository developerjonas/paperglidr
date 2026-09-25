import { PlaceholderScreen } from '@/components/placeholder-screen';
import { RequireAuth } from '@/components/require-auth';

export default function WishlistScreen() {
  return (
    <RequireAuth reason="see your wishlist">
      <PlaceholderScreen
        title="Wishlist"
        description="Products you saved."
        api="GET /api/v1/wishlist · DELETE /wishlist/:productId"
        links={[
          { label: "A saved product", href: "/products/sample" },
        ]}
      />
    </RequireAuth>
  );
}
