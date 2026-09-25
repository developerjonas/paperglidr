import { PlaceholderScreen } from '@/components/placeholder-screen';
import { RequireAuth } from '@/components/require-auth';

export default function SupportScreen() {
  return (
    <RequireAuth reason="see your support tickets" title="Support">
      <PlaceholderScreen
        title="Support"
        description="Your support tickets."
        api="GET /api/v1/support"
        links={[
          { label: "New ticket", href: "/support/new" },
          { label: "A ticket", href: "/support/sample" },
        ]}
      />
    </RequireAuth>
  );
}
