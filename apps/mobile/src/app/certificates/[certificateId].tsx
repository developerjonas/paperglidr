import { PlaceholderScreen } from '@/components/placeholder-screen';

export default function CertificateScreen() {
  return (
    <PlaceholderScreen
      title="Certificate"
      description="The certificate with its QR code for anyone to verify."
      api="GET /api/v1/certificates/:id"
      links={[
        { label: "Verify it", href: "/verify/sample" },
      ]}
    />
  );
}
