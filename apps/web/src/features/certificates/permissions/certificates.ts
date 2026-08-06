import { db } from "@/drizzle/db"
import { CertificateTable, UserRole } from "@/drizzle/schema"
import { eq } from "drizzle-orm"

export async function canViewCertificate(
  { userId, role }: { userId: string | undefined; role: UserRole | undefined },
  certificateId: string
) {
  if (role === "admin") return true
  if (userId == null) return false
  const certificate = await db.query.CertificateTable.findFirst({
    where: eq(CertificateTable.id, certificateId),
    columns: { userId: true },
  })
  return certificate?.userId === userId
}

export function canRevokeCertificate({ role }: { role: UserRole | undefined }) {
  return role === "admin"
}

// No permission function for verification-by-code — that page is intentionally
// public. Anyone with the code (or a scanned QR) can confirm authenticity.
