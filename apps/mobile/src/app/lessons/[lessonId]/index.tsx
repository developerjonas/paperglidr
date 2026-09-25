import { PlaceholderScreen } from '@/components/placeholder-screen';

export default function LessonScreen() {
  return (
    <PlaceholderScreen
      title="Lesson"
      description="Video or file, the description, and Mark complete."
      api="GET /api/v1/lessons/:id · /lessons/:id/assets/:assetId · POST /lessons/:id/complete"
      links={[
        { label: "Questions and answers", href: "/lessons/sample/questions" },
      ]}
    />
  );
}
