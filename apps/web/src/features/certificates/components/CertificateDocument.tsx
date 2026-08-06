import { CertificateQRCode } from "./CertificateQRCode"

export function CertificateDocument({
  certificate,
  isRevoked,
}: {
  certificate: {
    certificateCode: string
    userNameSnapshot: string
    courseTitleSnapshot: string
    instructorNameSnapshot: string
    issuedAt: Date
  }
  isRevoked?: boolean
}) {
  return (
    <div
      className={`relative max-w-3xl w-full mx-auto aspect-[1.414/1] border-8 p-12 flex flex-col items-center justify-center text-center gap-4 bg-background print:border-4 ${
        isRevoked ? "border-destructive" : "border-(--color-primary)"
      }`}
    >
      {isRevoked && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="text-6xl font-bold text-destructive/20 rotate-[-20deg] uppercase tracking-widest">
            Revoked
          </span>
        </div>
      )}
      <div className="text-sm uppercase tracking-widest text-muted-foreground">Certificate of Completion</div>
      <div className="text-3xl font-serif">{certificate.userNameSnapshot}</div>
      <div className="text-muted-foreground">has successfully completed</div>
      <div className="text-2xl font-semibold">{certificate.courseTitleSnapshot}</div>
      <div className="text-sm text-muted-foreground mt-6">
        Issued {certificate.issuedAt.toLocaleDateString()} · Instructor: {certificate.instructorNameSnapshot}
      </div>
      <div className="absolute bottom-6 right-6">
        <CertificateQRCode certificateCode={certificate.certificateCode} />
      </div>
      <div className="text-xs text-muted-foreground absolute bottom-6 left-6">{certificate.certificateCode}</div>
    </div>
  )
}
