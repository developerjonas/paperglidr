import { PlaceholderScreen } from '@/components/placeholder-screen';

export default function ForgotPasswordScreen() {
  return (
    <PlaceholderScreen
      title="Forgot password"
      description="Email a reset link. The reset itself happens on the website."
      api="POST /api/auth/request-password-reset"
      links={[
        { label: "Back to sign in", href: "/sign-in" },
      ]}
    />
  );
}
