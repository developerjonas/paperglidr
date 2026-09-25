import { AccountSession } from '@/components/account-session';
import { PlaceholderScreen } from '@/components/placeholder-screen';

export default function AccountScreen() {
  return (
    <PlaceholderScreen
      title="Account"
      description="Your profile and settings, with links to certificates, support and policies."
      api="GET /api/v1/me"
      links={[
        { label: "Profile", href: "/profile" },
        { label: "Edit profile", href: "/profile/edit" },
        { label: "Change password", href: "/profile/change-password" },
        { label: "My certificates", href: "/certificates" },
        { label: "Support", href: "/support" },
        { label: "Contact us", href: "/contact" },
        { label: "Terms and policies", href: "/legal" },
        { label: "Verify a certificate", href: "/verify" },
      ]}>
      <AccountSession />
    </PlaceholderScreen>
  );
}
