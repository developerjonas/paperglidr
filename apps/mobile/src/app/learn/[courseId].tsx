import { PlaceholderScreen } from '@/components/placeholder-screen';
import { RequireAuth } from '@/components/require-auth';

export default function LearnCourseScreen() {
  return (
    <RequireAuth reason="open your course" title="Course player">
      <PlaceholderScreen
        title="Course player"
        description="Your outline with completed lessons, progress, and your review."
        api="GET /api/v1/me/courses/:id · /courses/:id/review"
        links={[
          { label: "Open a lesson", href: "/lessons/sample" },
        ]}
      />
    </RequireAuth>
  );
}
