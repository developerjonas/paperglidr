import { PlaceholderScreen } from '@/components/placeholder-screen';
import { RequireAuth } from '@/components/require-auth';

export default function CertificatesScreen() {
  return (
    <RequireAuth reason="see your certificates" title="My certificates">
      <PlaceholderScreen
        title="My certificates"
        description="Certificates for the courses you completed."
        api="GET /api/v1/certificates"
        links={[
          { label: "A certificate", href: "/certificates/sample" },
        ]}
      />
    </RequireAuth>
  );
}
