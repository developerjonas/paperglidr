// apps/web/src/app/api/v1/certificates/[certificateId]/route.ts
import { apiError, apiJson, isUuid, requireApiUser, v1Route } from "@/lib/api/v1"
import { getCertificateForUser } from "@/features/certificates/db/certificates"
import { SITE_URL } from "@/lib/site"

/** One of the user's certificates. */
export const GET = v1Route<{ certificateId: string }>("certificate", async (_req, { params }) => {
  const gate = await requireApiUser()
  if (!gate.ok) return gate.response
  const { certificateId } = await params
  if (!isUuid(certificateId)) return apiError(404, "Certificate not found")

  const certificate = await getCertificateForUser({ certificateId, userId: gate.user.userId })
  if (!certificate) return apiError(404, "Certificate not found")

  return apiJson({
    id: certificate.id,
    certificateCode: certificate.certificateCode,
    courseId: certificate.courseId,
    userNameSnapshot: certificate.userNameSnapshot,
    courseTitleSnapshot: certificate.courseTitleSnapshot,
    instructorNameSnapshot: certificate.instructorNameSnapshot,
    courseDurationMinutesSnapshot: certificate.courseDurationMinutesSnapshot,
    issuedAt: certificate.issuedAt,
    revokedAt: certificate.revokedAt,
    revokedReason: certificate.revokedReason,
    verifyUrl: `${SITE_URL}/verify/${certificate.certificateCode}`,
  })
})
