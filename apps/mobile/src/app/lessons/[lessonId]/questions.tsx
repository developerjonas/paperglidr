import { PlaceholderScreen } from '@/components/placeholder-screen';

export default function LessonQuestionsScreen() {
  return (
    <PlaceholderScreen
      title="Q&A"
      description="Questions on this lesson and their replies; ask or reply."
      api="GET/POST /api/v1/lessons/:id/questions · POST /questions/:id/replies"
    />
  );
}
