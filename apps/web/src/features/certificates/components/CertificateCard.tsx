import Link from "next/link"
import { Button } from "@/components/ui/button"
import { AwardIcon, XCircleIcon } from "lucide-react"

export function CertificateCard({
  certificate,
}: {
  certificate: {
    id: string
    certificateCode: string
    courseTitleSnapshot: string
    issuedAt: Date
    revokedAt: Date | null
  }
}) {
  return (
    <div className="border rounded-lg p-4 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        {certificate.revokedAt ? (
          <XCircleIcon className="size-8 text-destructive" />
        ) : (
          <AwardIcon className="size-8 text-(--color-primary)" />
        )}
        <div>
          <div className="font-medium">{certificate.courseTitleSnapshot}</div>
          <div className="text-sm text-muted-foreground">
            Issued {certificate.issuedAt.toLocaleDateString()} · {certificate.certificateCode}
          </div>
        </div>
      </div>
      <Button asChild size="sm">
        <Link href={`/certificates/${certificate.id}`}>View</Link>
      </Button>
    </div>
  )
}
