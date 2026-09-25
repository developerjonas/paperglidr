import { PlaceholderScreen } from '@/components/placeholder-screen';

export default function VerifyResultScreen() {
  return (
    <PlaceholderScreen
      title="Certificate check"
      description="Whether the certificate is genuine, who earned it, for which course, and if it was revoked."
      api="GET /api/v1/certificates/verify/:code"
    />
  );
}
