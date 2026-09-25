import { PlaceholderScreen } from '@/components/placeholder-screen';

export default function LegalScreen() {
  return (
    <PlaceholderScreen
      title="Terms and policies"
      description="Every policy: terms, privacy, refunds, creator terms, content and DMCA."
      api="— (website pages)"
      links={[
        { label: "Terms of Service", href: "/legal/tos" },
        { label: "Privacy Policy", href: "/legal/privacy" },
        { label: "Refund Policy", href: "/legal/refund-policy" },
      ]}
    />
  );
}
