import { PlaceholderScreen } from '@/components/placeholder-screen';

export default function ChangePasswordScreen() {
  return (
    <PlaceholderScreen
      title="Change password"
      description="Current password, then a new one that passes the rules and isn't the current one."
      api="POST /api/auth/change-password"
    />
  );
}
