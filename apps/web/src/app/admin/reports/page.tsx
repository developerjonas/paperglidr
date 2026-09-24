import Link from "next/link"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { PageHeader } from "@/components/PageHeader"
import { getReportsForAdmin } from "@/features/reports/db/reports"
import { ReportRowActions } from "@/features/reports/components/ReportRowActions"
import { requireAdmin } from "@/services/auth"

const when = (date: Date | null) => (date ? new Date(date).toLocaleString() : "—")

type Report = Awaited<ReturnType<typeof getReportsForAdmin>>["open"][number]

function Target({ report }: { report: Report }) {
  if (report.targetType === "product" && report.product) {
    return (
      <>
        Product:{" "}
        <Link href={`/products/${report.product.id}`} className="underline">
          {report.product.name}
        </Link>{" "}
        <span className="text-muted-foreground">({report.product.status})</span>
      </>
    )
  }
  if (report.targetType === "lesson" && report.course) {
    return (
      <>
        Lesson in {report.course.name}:{" "}
        <Link href={`/courses/${report.course.id}/lessons/${report.targetId}`} className="underline">
          open lesson
        </Link>
      </>
    )
  }
  return (
    <>
      {report.targetType}: <code className="text-xs">{report.targetId}</code>
    </>
  )
}

export default async function AdminReportsPage() {
  await requireAdmin()
  const { open, closed } = await getReportsForAdmin()

  return (
    <div className="container my-6 flex flex-col gap-6">
      <PageHeader title="Reports" />
      <p className="max-w-3xl text-sm text-muted-foreground">
        Reports from the product and lesson pages. To take something down,
        unpublish it (or follow the DMCA process for copyright), then mark the
        report &quot;Action taken&quot;.
      </p>

      <h2 className="text-lg font-semibold">Open ({open.length})</h2>
      {open.length === 0 ? (
        <p className="text-sm text-muted-foreground">No open reports.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Reported</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Reporter</TableHead>
              <TableHead>When</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {open.map(report => (
              <TableRow key={report.id}>
                <TableCell className="text-sm">
                  <Target report={report} />
                </TableCell>
                <TableCell className="max-w-xs text-sm">
                  <strong>{report.reason}</strong>
                  {report.details && <p className="whitespace-pre-wrap">{report.details}</p>}
                </TableCell>
                <TableCell className="text-sm">
                  {report.reporter.name}
                  <br />
                  <span className="text-muted-foreground">{report.reporter.email}</span>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{when(report.createdAt)}</TableCell>
                <TableCell className="text-right">
                  <ReportRowActions reportId={report.id} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <h2 className="text-lg font-semibold">Recently closed</h2>
      {closed.length === 0 ? (
        <p className="text-sm text-muted-foreground">None yet.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Reported</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Outcome</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {closed.map(report => (
              <TableRow key={report.id}>
                <TableCell className="text-sm">
                  <Target report={report} />
                </TableCell>
                <TableCell className="text-sm">{report.reason}</TableCell>
                <TableCell className="max-w-xs text-sm">
                  {report.status === "action_taken" ? "Action taken" : "Dismissed"} by{" "}
                  {report.reviewer?.name ?? "—"} · {when(report.reviewedAt)}
                  {report.adminNote && <p className="whitespace-pre-wrap text-muted-foreground">{report.adminNote}</p>}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
