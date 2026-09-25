import { PlaceholderScreen } from '@/components/placeholder-screen';

export default function CertificatesScreen() {
  return (
    <PlaceholderScreen
      title="My certificates"
      description="Certificates for the courses you completed."
      api="GET /api/v1/certificates"
      links={[
        { label: "A certificate", href: "/certificates/sample" },
      ]}
    />
  );
}
