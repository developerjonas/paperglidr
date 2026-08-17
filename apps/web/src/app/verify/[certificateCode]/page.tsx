import { certificateCodeSchema } from "@/features/certificates/schemas/certificates";
import { getCertificateForVerification } from "@/features/certificates/actions/certificates";
import { CertificateDocument } from "@/features/certificates/components/CertificateDocument";
import { CheckCircle2Icon, XCircleIcon } from "lucide-react";
import { notFound } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";

export default async function VerifyCertificatePage({
  params,
}: {
  params: Promise<{ certificateCode: string }>;
}) {
  const { certificateCode } = await params;
  const { success } = certificateCodeSchema.safeParse(certificateCode);
  if (!success) notFound();

  const { certificate } = await getCertificateForVerification(certificateCode);

  if (certificate == null) {
    return (
      <div className="flex flex-col min-h-screen">
        <section className="relative overflow-hidden border-b border-white/10 bg-gradient-to-b from-destructive/5 via-background to-background py-14 md:py-20">
          <div className="absolute top-0 left-1/2 -z-10 h-[280px] w-[480px] -translate-x-1/2 rounded-full bg-destructive/10 blur-[120px]" />
          <div className="container mx-auto px-4">
            <div className="mx-auto flex max-w-md flex-col items-center gap-4 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
                <XCircleIcon className="size-8 text-destructive" />
              </div>
              <h1 className="text-2xl font-extrabold tracking-tight">
                Certificate not found
              </h1>
              <p className="text-sm text-muted-foreground">
                No certificate matches code{" "}
                <code className="rounded-[4px] bg-white/40 px-1.5 py-0.5 text-xs dark:bg-white/10">
                  {certificateCode}
                </code>
                . Double check it was copied correctly.
              </p>
            </div>
          </div>
        </section>
      </div>
    );
  }

  const isRevoked = certificate.revokedAt != null;

  return (
    <div className="flex flex-col min-h-screen">
      {/* ---------------- HERO ---------------- */}
      <section
        className={`relative overflow-hidden border-b border-white/10 bg-gradient-to-b py-14 md:py-20 ${
          isRevoked
            ? "from-destructive/5 via-background to-background"
            : "from-emerald-500/5 via-background to-background"
        }`}
      >
        <div
          className={`absolute top-0 left-1/2 -z-10 h-[280px] w-[480px] -translate-x-1/2 rounded-full blur-[120px] ${
            isRevoked ? "bg-destructive/10" : "bg-emerald-500/10"
          }`}
        />
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center gap-3 text-center">
            <div
              className={`flex h-14 w-14 items-center justify-center rounded-full ${
                isRevoked ? "bg-destructive/10" : "bg-emerald-500/10"
              }`}
            >
              {isRevoked ? (
                <XCircleIcon className="size-7 text-destructive" />
              ) : (
                <CheckCircle2Icon className="size-7 text-emerald-600" />
              )}
            </div>
            <h1
              className={`text-xl font-bold sm:text-2xl ${
                isRevoked ? "text-destructive" : "text-emerald-600"
              }`}
            >
              {isRevoked
                ? "This certificate has been revoked"
                : "Valid certificate"}
            </h1>
          </div>
        </div>
      </section>

      {/* ---------------- CONTENT ---------------- */}
      <section className="container mx-auto px-4 py-10">
        <div className="mx-auto flex max-w-2xl flex-col items-center gap-6">
          <Card className="w-full overflow-hidden border-white/30 bg-white/60 shadow-sm backdrop-blur-2xl backdrop-saturate-150 dark:border-white/10 dark:bg-black/40">
            <CardContent className="p-6">
              <CertificateDocument
                certificate={certificate}
                isRevoked={isRevoked}
              />
            </CardContent>
          </Card>

          <p className="max-w-md text-center text-sm text-muted-foreground">
            This page confirms{" "}
            <strong className="text-foreground">
              {certificate.userNameSnapshot}
            </strong>{" "}
            completed{" "}
            <strong className="text-foreground">
              {certificate.courseTitleSnapshot}
            </strong>{" "}
            on {certificate.issuedAt.toLocaleDateString()}.
          </p>
        </div>
      </section>
    </div>
  );
}
