// apps/web/src/app/api/v1/certificates/[certificateId]/route.ts
import { NextResponse } from "next/server"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { getCertificateForUser } from "@/features/certificates/db/certificates"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ certificateId: string }> },
) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  const { certificateId } = await params
  const certificate = await getCertificateForUser({
    certificateId,
    userId: session.user.id,
  })

  if (!certificate) {
    return NextResponse.json({ message: "Certificate not found" }, { status: 404 })
  }

  return NextResponse.json({
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
  })
}
