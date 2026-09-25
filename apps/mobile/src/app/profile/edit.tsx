import { PlaceholderScreen } from '@/components/placeholder-screen';

export default function EditProfileScreen() {
  return (
    <PlaceholderScreen
      title="Edit profile"
      description="Change your name and photo."
      api="POST /api/auth/update-user"
    />
  );
}
