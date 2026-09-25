import { PlaceholderScreen } from '@/components/placeholder-screen';
import { RequireAuth } from '@/components/require-auth';

export default function LessonQuestionsScreen() {
  return (
    <RequireAuth reason="see the questions and answers" title="Q&A">
      <PlaceholderScreen
        title="Q&A"
        description="Questions on this lesson and their replies; ask or reply."
        api="GET/POST /api/v1/lessons/:id/questions · POST /questions/:id/replies"
      />
    </RequireAuth>
  );
}
