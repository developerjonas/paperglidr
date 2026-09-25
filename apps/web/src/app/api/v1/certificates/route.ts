// apps/web/src/app/api/v1/certificates/route.ts
import { apiJson, requireApiUser, v1Route } from "@/lib/api/v1"
import { getCertificatesForUser } from "@/features/certificates/db/certificates"
import { SITE_URL } from "@/lib/site"

/** The user's certificates. `verifyUrl` is the public page a QR code points to. */
export const GET = v1Route("certificates", async () => {
  const gate = await requireApiUser()
  if (!gate.ok) return gate.response

  const certificates = await getCertificatesForUser(gate.user.userId)
  return apiJson(
    certificates.map(c => ({
      id: c.id,
      certificateCode: c.certificateCode,
      courseId: c.courseId,
      courseTitleSnapshot: c.courseTitleSnapshot,
      instructorNameSnapshot: c.instructorNameSnapshot,
      courseDurationMinutesSnapshot: c.courseDurationMinutesSnapshot,
      issuedAt: c.issuedAt,
      revokedAt: c.revokedAt,
      revokedReason: c.revokedReason,
      verifyUrl: `${SITE_URL}/verify/${c.certificateCode}`,
    })),
  )
})
