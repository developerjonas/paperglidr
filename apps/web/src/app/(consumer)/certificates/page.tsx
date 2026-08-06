import { getCurrentUser } from "@/services/clerk"
import { getUserCertificates } from "@/features/certificates/db/certificates"
import { CertificateCard } from "@/features/certificates/components/CertificateCard"

export default async function CertificatesPage() {
  const { userId } = await getCurrentUser()
  if (userId == null) return null

  const certificates = await getUserCertificates(userId)

  if (certificates.length === 0) {
    return <p className="text-muted-foreground">No certificates yet — finish a course to earn one.</p>
  }

  return (
    <div className="flex flex-col gap-3">
      {certificates.map(cert => (
        <CertificateCard key={cert.id} certificate={cert} />
      ))}
    </div>
  )
}
