import { PlaceholderScreen } from '@/components/placeholder-screen';
import { RequireAuth } from '@/components/require-auth';

export default function CertificateScreen() {
  return (
    <RequireAuth reason="see this certificate" title="Certificate">
      <PlaceholderScreen
        title="Certificate"
        description="The certificate with its QR code for anyone to verify."
        api="GET /api/v1/certificates/:id"
        links={[
          { label: "Verify it", href: "/verify/sample" },
        ]}
      />
    </RequireAuth>
  );
}
