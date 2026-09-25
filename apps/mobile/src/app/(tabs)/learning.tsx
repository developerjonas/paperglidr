import { PlaceholderScreen } from '@/components/placeholder-screen';

export default function LearningScreen() {
  return (
    <PlaceholderScreen
      title="My learning"
      description="The courses you can open, with your progress."
      api="GET /api/v1/me/courses"
      links={[
        { label: "Continue a course", href: "/learn/sample" },
        { label: "My certificates", href: "/certificates" },
      ]}
    />
  );
}
