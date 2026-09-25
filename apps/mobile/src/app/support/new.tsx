import { PlaceholderScreen } from '@/components/placeholder-screen';
import { RequireAuth } from '@/components/require-auth';

export default function NewTicketScreen() {
  return (
    <RequireAuth reason="contact support" title="New ticket">
      <PlaceholderScreen
        title="New ticket"
        description="Subject, category and your message."
        api="POST /api/v1/support"
      />
    </RequireAuth>
  );
}
