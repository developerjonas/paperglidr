// apps/web/src/app/api/v1/certificates/route.ts
import { NextResponse } from "next/server"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { getCertificatesForUser } from "@/features/certificates/db/certificates"

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  const certificates = await getCertificatesForUser(session.user.id)

  return NextResponse.json(
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
    })),
  )
}
