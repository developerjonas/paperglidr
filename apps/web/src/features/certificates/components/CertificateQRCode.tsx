import { generateCertificateQrSvg } from "../lib/qrcode";

export async function CertificateQRCode({
  certificateCode,
}: {
  certificateCode: string;
}) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (!appUrl) {
    // Fail loudly in dev/build logs rather than silently baking
    // "undefined/verify/..." into a QR code nobody can read.
    console.error(
      "NEXT_PUBLIC_APP_URL is not set — cannot generate a valid certificate verification QR code.",
    );
    return (
      <div className="flex h-24 w-24 flex-col items-center justify-center gap-1 rounded-[5px] border border-dashed border-muted-foreground/40 bg-background/80 p-1 text-center">
        <span className="text-[9px] text-muted-foreground">QR unavailable</span>
      </div>
    );
  }

  const verificationUrl = `${appUrl}/verify/${certificateCode}`;

  let svg: string | null = null;
  try {
    svg = await generateCertificateQrSvg(verificationUrl);
  } catch (error) {
    console.error("Failed to generate certificate QR code:", error);
  }

  if (!svg) {
    return (
      <div className="flex h-24 w-24 flex-col items-center justify-center gap-1 rounded-[5px] border border-dashed border-muted-foreground/40 bg-background/80 p-1 text-center">
        <span className="text-[9px] text-muted-foreground">QR unavailable</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="rounded-[5px] border border-muted-foreground/20 bg-white p-1.5 shadow-sm">
        <div
          className="h-16 w-16 sm:h-20 sm:w-20 [&>svg]:h-full [&>svg]:w-full"
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      </div>
      <span className="text-[9px] uppercase tracking-wide text-muted-foreground">
        Scan to verify
      </span>
    </div>
  );
}
