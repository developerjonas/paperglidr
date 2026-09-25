import { PlaceholderScreen } from '@/components/placeholder-screen';

export default function SignInScreen() {
  return (
    <PlaceholderScreen
      title="Sign in"
      description="Email or username and password, or continue with Google."
      api="POST /api/auth/sign-in/email · /sign-in/username · /sign-in/social"
      links={[
        { label: "Create an account", href: "/sign-up" },
        { label: "Forgot password?", href: "/forgot-password" },
      ]}
    />
  );
}
