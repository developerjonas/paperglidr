import { PlaceholderScreen } from '@/components/placeholder-screen';
import { RequireAuth } from '@/components/require-auth';

export default function ChangePasswordScreen() {
  return (
    <RequireAuth reason="change your password" title="Change password">
      <PlaceholderScreen
        title="Change password"
        description="Current password, then a new one that passes the rules and isn't the current one."
        api="POST /api/auth/change-password"
      />
    </RequireAuth>
  );
}
