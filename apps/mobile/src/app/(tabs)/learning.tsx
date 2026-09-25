import { PlaceholderScreen } from '@/components/placeholder-screen';
import { RequireAuth } from '@/components/require-auth';

export default function LearningScreen() {
  return (
    <RequireAuth reason="see your courses">
      <PlaceholderScreen
        title="My learning"
        description="The courses you can open, with your progress."
        api="GET /api/v1/me/courses"
        links={[
          { label: "Continue a course", href: "/learn/sample" },
          { label: "My certificates", href: "/certificates" },
        ]}
      />
    </RequireAuth>
  );
}
