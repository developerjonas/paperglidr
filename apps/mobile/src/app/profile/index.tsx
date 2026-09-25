import { PlaceholderScreen } from '@/components/placeholder-screen';

export default function ProfileScreen() {
  return (
    <PlaceholderScreen
      title="Profile"
      description="Your name, username, email and photo, and whether you teach on Chiyali."
      api="GET /api/v1/me"
      links={[
        { label: "Edit profile", href: "/profile/edit" },
        { label: "Change password", href: "/profile/change-password" },
      ]}
    />
  );
}
