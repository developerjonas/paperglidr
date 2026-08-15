import { notFound } from "next/navigation";
import Link from "next/link";
import { getCertificateForViewing } from "@/features/certificates/actions/certificates";
import { CertificateDocument } from "@/features/certificates/components/CertificateDocument";
import { CertificateDownloadButton } from "@/features/certificates/components/CertificateDownloadButton";
import { AddToLinkedInButton } from "@/features/certificates/components/AddToLinkedInButton";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, ArrowLeft, Award } from "lucide-react";

export default async function CertificateViewPage({
  params,
}: {
  params: Promise<{ certificateId: string }>;
}) {
  const { certificateId } = await params;
  const { error, certificate } = await getCertificateForViewing(certificateId);
  if (error || certificate == null) notFound();

  const isRevoked = certificate.revokedAt != null;

  return (
    <div className="flex flex-col min-h-screen">
      {/* ---------------- HEADER ---------------- */}
      <section className="relative overflow-hidden border-b border-white/10 bg-gradient-to-b from-primary/5 via-background to-background py-10 md:py-14 print:hidden">
        <div className="absolute top-0 left-1/2 -z-10 h-[260px] w-[460px] -translate-x-1/2 rounded-full bg-primary/10 blur-[120px]" />

        <div className="container mx-auto px-4">
          <Link
            href="/certificates"
            className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to certificates
          </Link>

          <div className="text-center">
            <Badge
              variant="secondary"
              className="mb-4 inline-flex items-center gap-1.5 border border-primary/20 bg-primary/10 px-3 py-1 text-xs text-primary backdrop-blur-md"
            >
              <Award className="h-3.5 w-3.5" />
              Certificate of Completion
            </Badge>
            <h1 className="mx-auto max-w-2xl text-2xl font-extrabold tracking-tight sm:text-3xl md:text-4xl">
              {certificate.courseTitleSnapshot}
            </h1>
          </div>
        </div>
      </section>

      {/* ---------------- REVOKED BANNER ---------------- */}
      {isRevoked && (
        <div className="border-b border-destructive/20 bg-destructive/10 print:hidden">
          <div className="container mx-auto flex items-center justify-center gap-2 px-4 py-3 text-center text-sm font-medium text-destructive">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            This certificate has been revoked and is no longer valid.
          </div>
        </div>
      )}

      {/* ---------------- CERTIFICATE DISPLAY ---------------- */}
      <section className="container mx-auto flex flex-col items-center gap-8 px-4 py-12 md:py-16">
        <div
          id="certificate-document"
          className="w-full max-w-4xl overflow-hidden rounded-2xl border border-white/30 bg-white/60 p-2 shadow-2xl backdrop-blur-2xl backdrop-saturate-150 dark:border-white/10 dark:bg-black/40 print:rounded-none print:border-none print:bg-transparent print:p-0 print:shadow-none"
        >
          <CertificateDocument
            certificate={certificate}
            isRevoked={isRevoked}
          />
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 print:hidden">
          <CertificateDownloadButton
            elementId="certificate-document"
            fileName={`${certificate.courseTitleSnapshot}-certificate.pdf`}
          />
          <AddToLinkedInButton
            certificateCode={certificate.certificateCode}
            courseTitle={certificate.courseTitleSnapshot}
            issuedAt={certificate.issuedAt}
          />
        </div>

        <p className="text-center text-xs text-muted-foreground print:hidden">
          Certificate code{" "}
          <span className="font-mono font-medium text-foreground">
            {certificate.certificateCode}
          </span>{" "}
          — verifiable at any time via the link on this certificate.
        </p>
      </section>
    </div>
  );
}
