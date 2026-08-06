import { db } from "@/drizzle/db"
import {
  CertificateTable,
  CourseTable,
  CourseSectionTable,
  LessonTable,
  UserLessonCompleteTable,
  UserTable,
} from "@/drizzle/schema"
import { wherePublicCourseSections } from "@/features/courseSections/permissions/sections"
import { wherePublicLessons } from "@/features/lessons/permissions/lessons"
import { and, count, eq } from "drizzle-orm"
import { revalidateCertificateCache } from "./cache/certificates"

function generateCertificateCode() {
  const random = crypto.randomUUID().replace(/-/g, "").slice(0, 10).toUpperCase()
  return `CERT-${random}`
}

export async function getCertificateByUserAndCourse({
  userId,
  courseId,
}: {
  userId: string
  courseId: string
}) {
  return db.query.CertificateTable.findFirst({
    where: and(eq(CertificateTable.userId, userId), eq(CertificateTable.courseId, courseId)),
  })
}

export async function getCertificate(id: string) {
  return db.query.CertificateTable.findFirst({
    where: eq(CertificateTable.id, id),
  })
}

// Public lookup for the verification page — keyed by the code embedded in the QR, not the DB id
export async function getCertificateByCode(certificateCode: string) {
  return db.query.CertificateTable.findFirst({
    where: eq(CertificateTable.certificateCode, certificateCode),
  })
}

export async function getUserCertificates(userId: string) {
  return db.query.CertificateTable.findMany({
    where: eq(CertificateTable.userId, userId),
    orderBy: (certificates, { desc }) => desc(certificates.issuedAt),
  })
}

async function getCourseCompletionCounts({
  userId,
  courseId,
}: {
  userId: string
  courseId: string
}) {
  const [totalResult] = await db
    .select({ count: count() })
    .from(LessonTable)
    .innerJoin(
      CourseSectionTable,
      and(
        eq(CourseSectionTable.id, LessonTable.sectionId),
        eq(CourseSectionTable.courseId, courseId),
        wherePublicCourseSections
      )
    )
    .where(wherePublicLessons)

  const [completedResult] = await db
    .select({ count: count() })
    .from(UserLessonCompleteTable)
    .innerJoin(LessonTable, eq(LessonTable.id, UserLessonCompleteTable.lessonId))
    .innerJoin(
      CourseSectionTable,
      and(
        eq(CourseSectionTable.id, LessonTable.sectionId),
        eq(CourseSectionTable.courseId, courseId),
        wherePublicCourseSections
      )
    )
    .where(and(eq(UserLessonCompleteTable.userId, userId), wherePublicLessons))

  return {
    total: totalResult?.count ?? 0,
    completed: completedResult?.count ?? 0,
  }
}

export async function isCourseCompleteForUser({
  userId,
  courseId,
}: {
  userId: string
  courseId: string
}) {
  const { total, completed } = await getCourseCompletionCounts({ userId, courseId })
  return total > 0 && completed >= total
}

/**
 * Idempotent — safe to call on every lesson completion toggle.
 */
export async function issueCertificateIfEligible({
  userId,
  courseId,
}: {
  userId: string
  courseId: string
}) {
  const existing = await getCertificateByUserAndCourse({ userId, courseId })
  if (existing != null) return existing

  const isComplete = await isCourseCompleteForUser({ userId, courseId })
  if (!isComplete) return null

  const [course, user] = await Promise.all([
    db.query.CourseTable.findFirst({
      where: eq(CourseTable.id, courseId),
      with: { author: true },
    }),
    db.query.UserTable.findFirst({
      where: eq(UserTable.id, userId),
    }),
  ])
  if (course == null || user == null) return null

  const [certificate] = await db
    .insert(CertificateTable)
    .values({
      certificateCode: generateCertificateCode(),
      userId,
      courseId,
      userNameSnapshot: user.name,
      courseTitleSnapshot: course.name,
      instructorNameSnapshot: course.author.name,
      courseDurationMinutesSnapshot: 0, // TODO — see "duration tracking" note below
    })
    .onConflictDoNothing()
    .returning()

  if (certificate == null) {
    return getCertificateByUserAndCourse({ userId, courseId })
  }

  revalidateCertificateCache({ id: certificate.id, userId, courseId })
  return certificate
}

export async function revokeCertificate({ id, reason }: { id: string; reason: string }) {
  const [certificate] = await db
    .update(CertificateTable)
    .set({ revokedAt: new Date(), revokedReason: reason })
    .where(eq(CertificateTable.id, id))
    .returning()
  if (certificate == null) throw new Error("Certificate not found")
  revalidateCertificateCache({
    id: certificate.id,
    userId: certificate.userId,
    courseId: certificate.courseId,
  })
  return certificate
}
