import { PlaceholderScreen } from '@/components/placeholder-screen';
import { RequireAuth } from '@/components/require-auth';

export default function TicketScreen() {
  return (
    <RequireAuth reason="see this ticket" title="Ticket">
      <PlaceholderScreen
        title="Ticket"
        description="The conversation with support, and a reply box."
        api="GET /api/v1/support/:id · POST /support/:id/messages"
      />
    </RequireAuth>
  );
}
