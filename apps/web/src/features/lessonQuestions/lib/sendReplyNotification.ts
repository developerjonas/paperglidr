import { Resend } from "resend"
import { db } from "@/drizzle/db"
import { UserTable, LessonTable, CourseSectionTable, CourseTable } from "@/drizzle/schema"
import { eq } from "drizzle-orm"

const resend = new Resend(process.env.RESEND_API_KEY!)

export async function sendReplyNotification({
  lessonId,
  askerUserId,
  replierName,
  replyBody,
}: {
  lessonId: string
  askerUserId: string
  replierName: string
  replyBody: string
}) {
  const [asker, lessonContext] = await Promise.all([
    db.query.UserTable.findFirst({ where: eq(UserTable.id, askerUserId) }),
    db
      .select({
        courseId: CourseTable.id,
        lessonName: LessonTable.name,
      })
      .from(LessonTable)
      .innerJoin(CourseSectionTable, eq(CourseSectionTable.id, LessonTable.sectionId))
      .innerJoin(CourseTable, eq(CourseTable.id, CourseSectionTable.courseId))
      .where(eq(LessonTable.id, lessonId))
      .limit(1)
      .then((rows) => rows[0]),
  ])

  if (asker == null || lessonContext == null) return

  const link = `${process.env.NEXT_PUBLIC_APP_URL}/courses/${lessonContext.courseId}/lessons/${lessonId}`

  // ADJUST: reusing INVOICE_FROM_EMAIL as the sender — swap for a
  // dedicated address if you want Q&A emails to look distinct from billing.
  await resend.emails.send({
    from: process.env.INVOICE_FROM_EMAIL!,
    to: asker.email,
    subject: `${replierName} replied to your question on "${lessonContext.lessonName}"`,
    html: `
      <p>Hi ${asker.name},</p>
      <p><strong>${replierName}</strong> replied to your question:</p>
      <blockquote>${replyBody}</blockquote>
      <p><a href="${link}">View the discussion</a></p>
    `,
  })
}
