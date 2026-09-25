import { PlaceholderScreen } from '@/components/placeholder-screen';

export default function ContactScreen() {
  return (
    <PlaceholderScreen
      title="Contact us"
      description="Support and legal email addresses and the registered office."
      api="GET /api/v1/config"
      links={[
        { label: "Open a support ticket", href: "/support/new" },
      ]}
    />
  );
}
