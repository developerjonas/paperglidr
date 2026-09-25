import { PlaceholderScreen } from '@/components/placeholder-screen';

export default function LearnCourseScreen() {
  return (
    <PlaceholderScreen
      title="Course player"
      description="Your outline with completed lessons, progress, and your review."
      api="GET /api/v1/me/courses/:id · /courses/:id/review"
      links={[
        { label: "Open a lesson", href: "/lessons/sample" },
      ]}
    />
  );
}
