import { PlaceholderScreen } from '@/components/placeholder-screen';

export default function BrowseScreen() {
  return (
    <PlaceholderScreen
      title="Browse"
      description="Search the catalogue with category, price and rating filters."
      api="GET /api/v1/search · /categories"
      links={[
        { label: "A product", href: "/products/sample" },
        { label: "An instructor", href: "/instructors/sample" },
      ]}
    />
  );
}
