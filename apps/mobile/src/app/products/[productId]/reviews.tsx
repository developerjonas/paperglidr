import { PlaceholderScreen } from '@/components/placeholder-screen';

export default function ProductReviewsScreen() {
  return (
    <PlaceholderScreen
      title="Reviews"
      description="Every visible review of this product's courses, newest first."
      api="GET /api/v1/products/:id/reviews"
    />
  );
}
