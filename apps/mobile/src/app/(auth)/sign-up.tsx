import { PlaceholderScreen } from '@/components/placeholder-screen';

export default function SignUpScreen() {
  return (
    <PlaceholderScreen
      title="Create an account"
      description="Name, username, email and a strong password, with the same rules as the website."
      api="POST /api/auth/sign-up/email · /is-username-available"
      links={[
        { label: "I already have an account", href: "/sign-in" },
      ]}
    />
  );
}
