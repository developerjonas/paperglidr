import { PlaceholderScreen } from '@/components/placeholder-screen';

export default function TicketScreen() {
  return (
    <PlaceholderScreen
      title="Ticket"
      description="The conversation with support, and a reply box."
      api="GET /api/v1/support/:id · POST /support/:id/messages"
    />
  );
}
