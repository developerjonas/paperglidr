import { notFound } from "next/navigation"
import { getCertificateForViewing } from "@/features/certificates/actions/certificates"
import { CertificateDocument } from "@/features/certificates/components/CertificateDocument"
import { CertificateDownloadButton } from "@/features/certificates/components/CertificateDownloadButton"
import { AddToLinkedInButton } from "@/features/certificates/components/AddToLinkedInButton"

export default async function CertificateViewPage({
  params,
}: {
  params: Promise<{ certificateId: string }>
}) {
  const { certificateId } = await params
  const { error, certificate } = await getCertificateForViewing(certificateId)
  if (error || certificate == null) notFound()

  return (
    <div className="flex flex-col items-center gap-6 py-8">
      <div id="certificate-document">
        <CertificateDocument certificate={certificate} isRevoked={certificate.revokedAt != null} />
      </div>
      <div className="flex gap-4 items-center print:hidden">
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
    </div>
  )
}
