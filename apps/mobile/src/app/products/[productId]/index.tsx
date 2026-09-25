import { PlaceholderScreen } from '@/components/placeholder-screen';

export default function ProductScreen() {
  return (
    <PlaceholderScreen
      title="Product"
      description="Details, instructor, the courses included, rating, and save to wishlist."
      api="GET /api/v1/products/:id · /products/:id/me · POST /wishlist"
      links={[
        { label: "Reviews", href: "/products/sample/reviews" },
        { label: "A course in it", href: "/courses/sample" },
        { label: "The instructor", href: "/instructors/sample" },
      ]}
    />
  );
}
