import Link from "next/link"
import { notFound } from "next/navigation"
import { AdminPageHeader, StatCard, StatusBadge, nprFromPaisa, shortDate } from "@/features/admin/components/AdminUi"
import { getCourseDetail } from "@/features/admin/db/catalogue"
import { requireAdmin } from "@/services/auth"

const ASSET_LABELS: Record<string, string> = {
  "youtube:youtube": "YouTube",
  "vimeo:vimeo": "Vimeo",
  "r2:video_file": "Uploaded video",
  "bunny:video_file": "Uploaded video",
  "r2:pdf": "PDF",
  "r2:image": "Image",
  "r2:audio": "Audio",
}
const assetLabel = (key: string) => ASSET_LABELS[key] ?? key.replace(":", " ")

export default async function AdminCoursePage({ params }: { params: Promise<{ courseId: string }> }) {
  await requireAdmin()
  const { courseId } = await params
  if (!/^[0-9a-f-]{36}$/i.test(courseId)) notFound()
  const course = await getCourseDetail(courseId)
  if (course == null) notFound()
  const lessonCount = course.sections.reduce((n, s) => n + s.lessons.length, 0)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/admin/courses" className="text-sm text-muted-foreground hover:underline">
          ← Courses
        </Link>
      </div>
      <AdminPageHeader
        title={course.name}
        description={
          <>
            By{" "}
            <Link href={`/admin/users/${course.authorId}`} className="text-primary hover:underline">
              {course.author}
            </Link>{" "}
            ({course.authorEmail}) · created {shortDate(course.createdAt)} · updated {shortDate(course.updatedAt)}
          </>
        }
      >
        <StatusBadge status={course.state} label={course.state === "draft" ? "not on sale" : undefined} />
      </AdminPageHeader>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Students" value={course.students} />
        <StatCard label="Lessons" value={lessonCount} note={`in ${course.sections.length} section(s)`} />
        <StatCard label="Rating" value={course.rating ?? "—"} note={`${course.reviews} review(s)`} href="/admin/reviews" />
        <StatCard label="Certificates issued" value={course.certificates} />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <section className="flex min-w-0 flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-sm xl:col-span-2">
          <h2 className="font-semibold">Outline</h2>
          <p className="text-xs text-muted-foreground">
            Lesson links open the lesson as a student would see it; admins can open locked lessons. Editing is done by the creator.
          </p>
          {course.sections.length === 0 ? (
            <p className="text-sm text-muted-foreground">No sections yet.</p>
          ) : (
            <ol className="flex flex-col gap-4">
              {course.sections.map((section) => (
                <li key={section.id}>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{section.name}</span>
                    <StatusBadge status={section.status} />
                  </div>
                  <ol className="ml-4 mt-2 flex flex-col gap-1 border-l border-border pl-3">
                    {section.lessons.length === 0 && <li className="text-sm text-muted-foreground">No lessons.</li>}
                    {section.lessons.map((lesson) => (
                      <li key={lesson.id} className="flex flex-wrap items-center gap-2 text-sm">
                        <Link href={`/courses/${course.id}/lessons/${lesson.id}`} className="hover:underline">
                          {lesson.name}
                        </Link>
                        <StatusBadge status={lesson.status} />
                        {lesson.assets.length === 0 ? (
                          <span className="text-xs text-amber-700 dark:text-amber-400">no content</span>
                        ) : (
                          <span className="text-xs text-muted-foreground">{[...new Set(lesson.assets.map(assetLabel))].join(", ")}</span>
                        )}
                      </li>
                    ))}
                  </ol>
                </li>
              ))}
            </ol>
          )}
        </section>

        <div className="flex min-w-0 flex-col gap-6">
          <section className="flex min-w-0 flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-sm">
            <h2 className="font-semibold">Sold in</h2>
            {course.products.length === 0 ? (
              <p className="text-sm text-muted-foreground">Not in any product.</p>
            ) : (
              <ul className="flex flex-col gap-3 text-sm">
                {course.products.map((p) => (
                  <li key={p.id} className="flex flex-col gap-1">
                    <div className="flex items-center justify-between gap-2">
                      <Link href={`/products/${p.id}`} className="font-medium hover:underline">
                        {p.name}
                      </Link>
                      <StatusBadge status={p.status} label={p.status === "public" ? "live" : undefined} />
                    </div>
                    <span className="text-muted-foreground">
                      {p.priceInRupees === 0 ? "Free" : nprFromPaisa(p.priceInRupees * 100)} · {p.sales} sale(s){p.featured && " · featured"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <Link href="/admin/products?status=all" className="text-sm text-primary hover:underline">
              Manage products →
            </Link>
          </section>

          <section className="flex min-w-0 flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-sm">
            <h2 className="font-semibold">Newest students</h2>
            {course.recentStudents.length === 0 ? (
              <p className="text-sm text-muted-foreground">None yet.</p>
            ) : (
              <ul className="flex flex-col gap-2 text-sm">
                {course.recentStudents.map((s) => (
                  <li key={s.id} className="flex justify-between gap-2">
                    <Link href={`/admin/users/${s.id}`} className="hover:underline">
                      {s.name}
                    </Link>
                    <span className="text-muted-foreground">{shortDate(s.since)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="flex min-w-0 flex-col gap-2 rounded-xl border border-border bg-card p-4 shadow-sm">
            <h2 className="font-semibold">Description</h2>
            <p className="whitespace-pre-wrap text-sm text-muted-foreground">{course.description}</p>
          </section>
        </div>
      </div>
    </div>
  )
}
