import { PlaceholderScreen } from '@/components/placeholder-screen';

export default function VerifyScannerScreen() {
  return (
    <PlaceholderScreen
      title="Verify a certificate"
      description="Scan a certificate's QR code, or type its code."
      api="— (camera)"
      links={[
        { label: "Result for a code", href: "/verify/sample" },
      ]}
    />
  );
}
