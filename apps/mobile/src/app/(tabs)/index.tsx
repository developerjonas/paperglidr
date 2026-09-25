import { ApiStatus } from '@/components/api-status';
import { PlaceholderScreen } from '@/components/placeholder-screen';

export default function HomeScreen() {
  return (
    <PlaceholderScreen
      title="Home"
      description="Featured courses and categories, and Continue learning when signed in."
      api="GET /api/v1/products · /categories · /me/courses"
      links={[
        { label: "Browse courses", href: "/browse" },
        { label: "A product", href: "/products/sample" },
        { label: "Verify a certificate", href: "/verify" },
        { label: "Sign in", href: "/sign-in" },
      ]}
      headerShown={false}>
      <ApiStatus />
    </PlaceholderScreen>
  );
}
