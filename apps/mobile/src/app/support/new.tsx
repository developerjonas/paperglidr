import { PlaceholderScreen } from '@/components/placeholder-screen';

export default function NewTicketScreen() {
  return (
    <PlaceholderScreen
      title="New ticket"
      description="Subject, category and your message."
      api="POST /api/v1/support"
    />
  );
}
