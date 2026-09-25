import { getCurrentUser } from "@/services/auth";
import { getUserCertificates } from "@/features/certificates/db/certificates";
import { CertificateCard } from "@/features/certificates/components/CertificateCard";
import { Award, Sparkles } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default async function CertificatesPage() {
  const { userId } = await getCurrentUser();
  if (userId == null) return null;

  const certificates = await getUserCertificates(userId);

  return (
    <div className="flex flex-col min-h-screen">
      {/* ---------------- HERO ---------------- */}
      <section className="relative overflow-hidden section-muted border-b py-14 md:py-20">

        <div className="container mx-auto px-4 text-center">
          <Badge
            variant="secondary"
            className="mb-4 inline-flex items-center gap-1.5 border border-primary/20 bg-primary/10 px-3 py-1 text-xs text-primary"
          >
            <Award className="h-3.5 w-3.5" />
            Your Achievements
          </Badge>

          <h1 className="mx-auto max-w-2xl text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl">
            Certificates
          </h1>

          <p className="mx-auto mt-3 max-w-xl text-muted-foreground text-sm sm:text-base">
            {certificates.length > 0
              ? "Every course you've completed, verified and ready to share."
              : "Finish a course to earn your first certificate."}
          </p>

          {certificates.length > 0 && (
            <div className="mt-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <span className="text-2xl font-bold text-foreground">
                {certificates.length}
              </span>
              {certificates.length === 1
                ? "certificate earned"
                : "certificates earned"}
            </div>
          )}
        </div>
      </section>

      {/* ---------------- CONTENT ---------------- */}
      <section className="container mx-auto px-4 py-10">
        {certificates.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {certificates.map((cert) => (
              <CertificateCard key={cert.id} certificate={cert} />
            ))}
          </div>
        ) : (
          <div className="mx-auto flex max-w-md flex-col items-center gap-4 rounded-2xl border border-dashed border-border bg-muted/20 p-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Sparkles className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-semibold">No certificates yet</h3>
              <p className="text-sm text-muted-foreground">
                Complete any course from start to finish and your certificate
                will show up here automatically.
              </p>
            </div>
            <Button asChild className="mt-2 rounded-full">
              <Link href="/browse">Browse courses</Link>
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}
