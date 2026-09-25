import { PlaceholderScreen } from '@/components/placeholder-screen';
import { RequireAuth } from '@/components/require-auth';

export default function EditProfileScreen() {
  return (
    <RequireAuth reason="edit your profile" title="Edit profile">
      <PlaceholderScreen
        title="Edit profile"
        description="Change your name and photo."
        api="POST /api/auth/update-user"
      />
    </RequireAuth>
  );
}
