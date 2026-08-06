import { certificateCodeSchema } from "@/features/certificates/schemas/certificates"
import { getCertificateForVerification } from "@/features/certificates/actions/certificates"
import { CertificateDocument } from "@/features/certificates/components/CertificateDocument"
import { CheckCircle2Icon, XCircleIcon } from "lucide-react"
import { notFound } from "next/navigation"

export default async function VerifyCertificatePage({
  params,
}: {
  params: Promise<{ certificateCode: string }>
}) {
  const { certificateCode } = await params
  const { success } = certificateCodeSchema.safeParse(certificateCode)
  if (!success) notFound()

  const { certificate } = await getCertificateForVerification(certificateCode)

  if (certificate == null) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center max-w-md mx-auto">
        <XCircleIcon className="size-12 text-destructive" />
        <h1 className="text-xl font-semibold">Certificate not found</h1>
        <p className="text-muted-foreground">
          No certificate matches code <code>{certificateCode}</code>. Double check it was copied
          correctly.
        </p>
      </div>
    )
  }

  const isRevoked = certificate.revokedAt != null

  return (
    <div className="flex flex-col items-center gap-6 py-8">
      <div className="flex items-center gap-2">
        {isRevoked ? (
          <>
            <XCircleIcon className="size-6 text-destructive" />
            <span className="font-medium text-destructive">This certificate has been revoked</span>
          </>
        ) : (
          <>
            <CheckCircle2Icon className="size-6 text-emerald-600" />
            <span className="font-medium text-emerald-600">Valid certificate</span>
          </>
        )}
      </div>
      <CertificateDocument certificate={certificate} isRevoked={isRevoked} />
      <div className="text-sm text-muted-foreground text-center max-w-md">
        This page confirms <strong>{certificate.userNameSnapshot}</strong> completed{" "}
        <strong>{certificate.courseTitleSnapshot}</strong> on {certificate.issuedAt.toLocaleDateString()}.
      </div>
    </div>
  )
}
