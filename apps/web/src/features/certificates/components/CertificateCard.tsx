import Link from "next/link";
import { AwardIcon, XCircleIcon, ArrowRightIcon } from "lucide-react";

export function CertificateCard({
  certificate,
}: {
  certificate: {
    id: string;
    certificateCode: string;
    courseTitleSnapshot: string;
    issuedAt: Date;
    revokedAt: Date | null;
  };
}) {
  const isRevoked = certificate.revokedAt != null;

  return (
    <Link
      href={`/certificates/${certificate.id}`}
      className="group relative block overflow-hidden rounded-2xl border border-white/30 bg-white/50 backdrop-blur-md transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/5 dark:border-white/10 dark:bg-white/[0.03]"
    >
      {/* ---- Ribbon strip: diagonal texture evoking an embossed certificate header ---- */}
      <div
        className={`relative h-14 overflow-hidden ${
          isRevoked
            ? "bg-gradient-to-r from-muted to-muted/60"
            : "bg-gradient-to-r from-primary via-primary to-primary/80"
        }`}
      >
        <div
          className="absolute inset-0 opacity-[0.15]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(135deg, #fff 0px, #fff 1px, transparent 1px, transparent 12px)",
          }}
        />
      </div>

      {/* ---- Seal medallion: overlaps the ribbon strip and the card body ---- */}
      <div className="absolute left-6 top-6">
        <div
          className={`flex h-14 w-14 items-center justify-center rounded-full border-4 shadow-md ${
            isRevoked
              ? "border-background bg-muted text-muted-foreground"
              : "border-background bg-gradient-to-b from-primary to-primary/80 text-primary-foreground"
          }`}
        >
          {isRevoked ? (
            <XCircleIcon className="size-6" />
          ) : (
            <AwardIcon className="size-6" />
          )}
        </div>
      </div>

      <div className="flex flex-col gap-4 px-6 pb-6 pt-10">
        <div className="flex flex-col gap-1">
          <span
            className={`text-[10px] font-semibold uppercase tracking-wider ${
              isRevoked ? "text-destructive" : "text-primary"
            }`}
          >
            {isRevoked ? "Revoked" : "Certificate of Completion"}
          </span>
          <h3 className="text-lg font-bold leading-snug tracking-tight text-foreground line-clamp-2">
            {certificate.courseTitleSnapshot}
          </h3>
        </div>

        <div className="flex items-center justify-between border-t border-white/20 pt-3 dark:border-white/10">
          <div className="flex flex-col gap-0.5 text-xs text-muted-foreground">
            <span>
              Issued{" "}
              {certificate.issuedAt.toLocaleDateString(undefined, {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </span>
            <span className="font-mono">{certificate.certificateCode}</span>
          </div>

          <span className="flex items-center gap-1 text-sm font-medium text-foreground transition-transform group-hover:translate-x-0.5">
            View
            <ArrowRightIcon className="size-3.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}
