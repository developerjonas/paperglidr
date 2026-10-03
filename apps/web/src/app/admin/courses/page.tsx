import Link from "next/link"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AdminPageHeader, FilterTabs, Pager, SearchForm, StatusBadge, shortDate } from "@/features/admin/components/AdminUi"
import { COURSE_FILTERS, type CourseFilter, getCourseFilterCounts, listCourses } from "@/features/admin/db/catalogue"
import { requireAdmin } from "@/services/auth"

const LABELS: Record<CourseFilter, string> = { all: "All", paid: "Paid", free: "Free", draft: "Not on sale" }

export default async function AdminCoursesPage({ searchParams }: { searchParams: Promise<{ q?: string; filter?: string; page?: string }> }) {
  await requireAdmin()
  const params = await searchParams
  const filter: CourseFilter = (COURSE_FILTERS as readonly string[]).includes(params.filter ?? "") ? (params.filter as CourseFilter) : "all"
  const q = params.q?.trim() || undefined
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1)
  const [{ rows, hasMore }, counts] = await Promise.all([listCourses({ q, filter, page }), getCourseFilterCounts()])
  const href = (next: { filter?: string; page?: number }) => {
    const search = new URLSearchParams()
    const f = next.filter ?? filter
    if (f !== "all") search.set("filter", f)
    if (q) search.set("q", q)
    if (next.page && next.page > 1) search.set("page", String(next.page))
    const s = search.toString()
    return s ? `/admin/courses?${s}` : "/admin/courses"
  }

  return (
    <div className="flex flex-col gap-4">
      <AdminPageHeader
        title="Courses"
        description="Every course creators have made. Paid = in a paid product that's live or in review (uploaded video only, except previews); free = in a live free product (YouTube/Vimeo links only); not on sale = a draft."
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <FilterTabs
          label="Course state"
          current={filter}
          hrefFor={(value) => href({ filter: value })}
          options={COURSE_FILTERS.map((value) => ({ value, label: LABELS[value], count: counts[value] }))}
        />
        <SearchForm placeholder="Course or creator" value={q} hidden={{ filter: filter === "all" ? undefined : filter }} />
      </div>
      {rows.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          {q ? `No courses match "${q}".` : "No courses here."}
        </p>
      ) : (
        <div className="rounded-xl border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Course</TableHead>
                <TableHead>Creator</TableHead>
                <TableHead>State</TableHead>
                <TableHead className="text-right">Sections</TableHead>
                <TableHead className="text-right">Lessons</TableHead>
                <TableHead className="text-right">Students</TableHead>
                <TableHead className="text-right">Rating</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="max-w-xs">
                    <Link href={`/admin/courses/${c.id}`} className="font-medium hover:underline">
                      {c.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-sm">
                    <Link href={`/admin/users/${c.authorId}`} className="hover:underline">
                      {c.author}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={c.state} label={c.state === "draft" ? "not on sale" : undefined} />
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{c.sections}</TableCell>
                  <TableCell className="text-right tabular-nums">{c.lessons}</TableCell>
                  <TableCell className="text-right tabular-nums">{c.students}</TableCell>
                  <TableCell className="text-right tabular-nums">{c.rating ?? "—"}</TableCell>
                  <TableCell className="whitespace-nowrap text-sm text-muted-foreground">{shortDate(c.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      <Pager page={page} hasMore={hasMore} hrefFor={(n) => href({ page: n })} />
    </div>
  )
}
