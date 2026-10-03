import Link from "next/link"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PageHeader } from "@/components/PageHeader"
import { getCreatorSales, getLaunchDays, getLaunchSummary } from "@/features/analytics/db/launch"
import { formatNumber, formatPrice } from "@/lib/formatters"
import { requireAdmin } from "@/services/auth"
import { cn } from "@/lib/utils"

const RANGES = [7, 30, 90] as const
const npr = (paisa: number) => formatPrice(paisa / 100, { showZeroAsNumber: true })
const pct = (part: number, whole: number) => (whole === 0 ? "—" : `${Math.round((100 * part) / whole)}%`)

/**
 * Growth at a glance for the launch (docs/GTM_PLAN.md §3.6): sign-ups,
 * sales, conversion, the share of sales from creators' own ?ref= links,
 * and each creator's sales. Money totals and fees are on /admin/revenue.
 */
export default async function AdminLaunchPage({ searchParams }: { searchParams: Promise<{ days?: string }> }) {
  await requireAdmin()
  const requested = Number((await searchParams).days)
  const days = RANGES.includes(requested as (typeof RANGES)[number]) ? requested : 30

  const [summary, daily, creators] = await Promise.all([
    getLaunchSummary(days),
    getLaunchDays(Math.min(days, 30)),
    getCreatorSales(days),
  ])
  const noSales = creators.filter((c) => c.allTimeSales === 0)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PageHeader title="Launch" />
        <nav className="flex gap-1 rounded-lg border p-1 text-sm" aria-label="Time range">
          {RANGES.map((range) => (
            <Link
              key={range}
              href={`/admin/launch?days=${range}`}
              aria-current={range === days ? "page" : undefined}
              className={cn(
                "rounded-md px-3 py-1",
                range === days ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent",
              )}
            >
              {range} days
            </Link>
          ))}
        </nav>
      </div>
      <p className="max-w-3xl text-sm text-muted-foreground">
        Last {days} days, Nepal time. A paid sale is a completed gateway purchase (refunded ones included); free
        enrollments are counted separately. Money totals and fees are on{" "}
        <Link href="/admin/revenue" className="text-primary hover:underline">
          Revenue
        </Link>
        .
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Sign-ups" value={formatNumber(summary.signups)} />
        <Stat
          label="Paid sales"
          value={formatNumber(summary.paidSales)}
          note={`${npr(summary.gmvPaisa)} in sales`}
        />
        <Stat label="Free enrollments" value={formatNumber(summary.freeEnrollments)} />
        <Stat
          label="Checkout completion"
          value={pct(summary.paidSales, summary.checkoutsStarted)}
          note={`${formatNumber(summary.paidSales)} of ${formatNumber(summary.checkoutsStarted)} checkouts started`}
        />
        <Stat
          label="Sign-up → purchase"
          value={pct(summary.buyersAmongSignups, summary.signups)}
          note={`${formatNumber(summary.buyersAmongSignups)} of the new sign-ups bought something`}
        />
        <Stat
          label="Sales via creators' own links"
          value={pct(summary.salesViaOwnLink, summary.paidSales)}
          note="Target: at least half (GTM plan)"
        />
        <Stat label="Creators with no sale yet" value={formatNumber(noSales.length)} note="Worth a check-in call" />
      </div>

      <h2 className="text-lg font-semibold">By creator</h2>
      {creators.length === 0 ? (
        <p className="text-sm text-muted-foreground">No creators with live courses yet.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Creator</TableHead>
              <TableHead className="text-right">Live courses</TableHead>
              <TableHead className="text-right">Paid sales</TableHead>
              <TableHead className="text-right">Sales (NPR)</TableHead>
              <TableHead className="text-right">Via own link</TableHead>
              <TableHead className="text-right">All-time sales</TableHead>
              <TableHead>Last sale</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {creators.map((creator) => (
              <TableRow key={creator.userId}>
                <TableCell className="text-sm font-medium">
                  {creator.handle ? (
                    <Link href={`/instructors/${creator.handle}`} className="hover:underline">
                      {creator.name}
                    </Link>
                  ) : (
                    creator.name
                  )}
                </TableCell>
                <TableCell className="text-right text-sm">{creator.liveProducts}</TableCell>
                <TableCell className="text-right text-sm">{creator.paidSales}</TableCell>
                <TableCell className="text-right text-sm">{npr(creator.gmvPaisa)}</TableCell>
                <TableCell className="text-right text-sm">{pct(creator.salesViaOwnLink, creator.paidSales)}</TableCell>
                <TableCell className="text-right text-sm">{creator.allTimeSales}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {creator.lastSaleAt ? creator.lastSaleAt.toLocaleDateString() : "No sale yet"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <h2 className="text-lg font-semibold">By day{days > 30 ? " (last 30 days)" : ""}</h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Day</TableHead>
            <TableHead className="text-right">Sign-ups</TableHead>
            <TableHead className="text-right">Paid sales</TableHead>
            <TableHead className="text-right">Sales (NPR)</TableHead>
            <TableHead className="text-right">Free enrollments</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {daily.map((day) => (
            <TableRow key={day.day}>
              <TableCell className="text-sm">{day.day}</TableCell>
              <TableCell className="text-right text-sm">{day.signups}</TableCell>
              <TableCell className="text-right text-sm">{day.paidSales}</TableCell>
              <TableCell className="text-right text-sm">{npr(day.gmvPaisa)}</TableCell>
              <TableCell className="text-right text-sm">{day.freeEnrollments}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

function Stat({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <Card className="gap-1">
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-3xl">{value}</CardTitle>
        {note && <p className="text-xs text-muted-foreground">{note}</p>}
      </CardHeader>
    </Card>
  )
}
