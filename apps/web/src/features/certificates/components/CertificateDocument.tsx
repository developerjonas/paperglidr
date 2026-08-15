import { CertificateQRCode } from "./CertificateQRCode";

export function CertificateDocument({
  certificate,
  isRevoked,
}: {
  certificate: {
    certificateCode: string;
    userNameSnapshot: string;
    courseTitleSnapshot: string;
    instructorNameSnapshot: string;
    issuedAt: Date;
  };
  isRevoked?: boolean;
}) {
  const accent = isRevoked
    ? "var(--color-destructive)"
    : "var(--color-primary)";

  return (
    <div
      className="relative mx-auto aspect-[1.414/1] w-full max-w-3xl bg-background p-3 print:p-1"
      style={{ printColorAdjust: "exact", WebkitPrintColorAdjust: "exact" }}
    >
      {/* ---- Outer hairline + inner heavy rule: the classic double-frame ---- */}
      <div
        className="relative flex h-full w-full flex-col items-center justify-between overflow-hidden border p-1.5"
        style={{ borderColor: accent }}
      >
        <div
          className="flex h-full w-full flex-col items-center justify-between border-[3px] px-10 py-8 sm:px-14 sm:py-10"
          style={{ borderColor: accent }}
        >
          {/* ---- Guilloché-style background texture ---- */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: `repeating-radial-gradient(circle at 50% 50%, ${accent} 0px, ${accent} 1px, transparent 1px, transparent 14px)`,
            }}
          />

          {/* ---- Corner flourishes ---- */}
          {[
            "top-2 left-2 rotate-0",
            "top-2 right-2 rotate-90",
            "bottom-2 right-2 rotate-180",
            "bottom-2 left-2 -rotate-90",
          ].map((pos) => (
            <svg
              key={pos}
              viewBox="0 0 40 40"
              className={`absolute h-8 w-8 ${pos}`}
              style={{ color: accent }}
            >
              <path
                d="M2 2 L2 20 M2 2 L20 2"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              />
              <circle cx="2" cy="2" r="3" fill="currentColor" />
            </svg>
          ))}

          {isRevoked && (
            <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
              <span className="rotate-[-18deg] rounded border-4 border-destructive px-6 py-2 text-4xl font-bold uppercase tracking-[0.3em] text-destructive/70 sm:text-6xl">
                Revoked
              </span>
            </div>
          )}

          {/* ---- Header ---- */}
          <div className="z-10 flex flex-col items-center gap-1">
            <div className="text-[10px] font-semibold uppercase tracking-[0.35em] text-muted-foreground sm:text-xs">
              PaperGlidr
            </div>
            <div
              className="mt-2 text-xs font-medium uppercase tracking-[0.25em] sm:text-sm"
              style={{ color: accent }}
            >
              Certificate of Completion
            </div>
          </div>

          {/* ---- Body ---- */}
          <div className="z-10 flex flex-col items-center gap-3 text-center">
            <div className="text-xs uppercase tracking-widest text-muted-foreground sm:text-sm">
              This certifies that
            </div>
            <div className="font-serif text-3xl italic leading-tight text-foreground sm:text-4xl md:text-5xl">
              {certificate.userNameSnapshot}
            </div>
            <div
              className="h-px w-40 sm:w-56"
              style={{ backgroundColor: accent, opacity: 0.4 }}
            />
            <div className="max-w-xl text-xs text-muted-foreground sm:text-sm">
              has successfully completed all requirements of the course
            </div>
            <div className="max-w-xl px-4 text-lg font-bold leading-snug tracking-tight text-foreground sm:text-2xl">
              {certificate.courseTitleSnapshot}
            </div>
          </div>

          {/* ---- Footer: signature block + seal ---- */}
          <div className="z-10 flex w-full items-end justify-between gap-4">
            <div className="flex flex-col items-center gap-1">
              <div className="font-serif text-sm italic text-foreground sm:text-base">
                {certificate.instructorNameSnapshot}
              </div>
              <div className="w-28 border-t border-muted-foreground/40 pt-1 text-[9px] uppercase tracking-wider text-muted-foreground sm:w-36 sm:text-[10px]">
                Instructor
              </div>
            </div>

            {/* ---- Wax-seal medallion ---- */}
            <div className="relative flex shrink-0 flex-col items-center">
              <div
                className="flex h-14 w-14 items-center justify-center rounded-full border-2 sm:h-16 sm:w-16"
                style={{ borderColor: accent }}
              >
                <div
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-dashed text-[8px] font-bold uppercase tracking-widest sm:h-12 sm:w-12 sm:text-[9px]"
                  style={{ borderColor: accent, color: accent }}
                >
                  Verified
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center gap-1">
              <div className="font-serif text-sm italic text-foreground sm:text-base">
                {certificate.issuedAt.toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </div>
              <div className="w-28 border-t border-muted-foreground/40 pt-1 text-[9px] uppercase tracking-wider text-muted-foreground sm:w-36 sm:text-[10px]">
                Date Issued
              </div>
            </div>
          </div>

          {/* ---- QR + code ---- */}
          <div className="absolute bottom-3 right-3 z-10 sm:bottom-4 sm:right-4">
            <CertificateQRCode certificateCode={certificate.certificateCode} />
          </div>
          <div className="absolute bottom-3 left-3 z-10 font-mono text-[9px] text-muted-foreground sm:bottom-4 sm:left-4 sm:text-[10px]">
            {certificate.certificateCode}
          </div>
        </div>
      </div>
    </div>
  );
}
