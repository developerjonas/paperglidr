import Link from "next/link"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  AdminPageHeader,
  AttentionCard,
  StatCard,
  StatusBadge,
  nprFromPaisa,
  shortDateTime,
} from "@/features/admin/components/AdminUi"
import { getAttentionCounts } from "@/features/admin/db/attention"
import { getCatalogueTotals, getRecentPurchases, getRecentSignups } from "@/features/admin/db/overview"
import { getLaunchSummary } from "@/features/analytics/db/launch"
import { formatNumber } from "@/lib/formatters"
import { requireAdmin } from "@/services/auth"

/** The admin home: what needs doing now, the last 7 days, and recent activity. */
export default async function AdminOverviewPage() {
  await requireAdmin()
  const [attention, week, totals, purchases, signups] = await Promise.all([
    getAttentionCounts(),
    getLaunchSummary(7),
    getCatalogueTotals(),
    getRecentPurchases(),
    getRecentSignups(),
  ])

  return (
    <div className="flex flex-col gap-8">
      <AdminPageHeader title="Overview" description="What needs your attention, and how the last 7 days went." />

      <section aria-labelledby="attention" className="flex flex-col gap-3">
        <h2 id="attention" className="text-lg font-semibold">Needs attention</h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <AttentionCard label="Stuck payments" count={attention.stuckPayments} description="Pending over an hour: re-check them" href="/admin/purchases?status=pending" urgent />
          <AttentionCard label="Disputed payments" count={attention.disputedPayments} description="Amount mismatch or reused transaction" href="/admin/purchases?status=disputed" urgent />
          <AttentionCard label="Courses to review" count={attention.productsPending} description="Submitted by creators" href="/admin/products" />
          <AttentionCard label="Refunds" count={attention.refunds} description="To decide, or to pay back" href="/admin/refunds" />
          <AttentionCard label="Payout requests" count={attention.payouts} description="Creators waiting to be paid" href="/admin/payouts" />
          <AttentionCard label="Support tickets" count={attention.openTickets} description="Open or in progress" href="/admin/support" />
          <AttentionCard label="Reports" count={attention.reports} description="Reported content to check" href="/admin/reports" />
        </div>
      </section>

      <section aria-labelledby="week" className="flex flex-col gap-3">
        <div className="flex items-end justify-between gap-3">
          <h2 id="week" className="text-lg font-semibold">Last 7 days</h2>
          <Link href="/admin/launch" className="text-sm text-primary hover:underline">
            More launch metrics →
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Sign-ups" value={formatNumber(week.signups)} />
          <StatCard label="Paid sales" value={formatNumber(week.paidSales)} note={`${nprFromPaisa(week.gmvPaisa)} in sales`} />
          <StatCard label="Free enrollments" value={formatNumber(week.freeEnrollments)} />
          <StatCard
            label="Checkout completion"
            value={week.checkoutsStarted === 0 ? "—" : `${Math.round((100 * week.paidSales) / week.checkoutsStarted)}%`}
            note={`${week.paidSales} of ${week.checkoutsStarted} checkouts`}
          />
        </div>
      </section>

      <section aria-labelledby="totals" className="flex flex-col gap-3">
        <h2 id="totals" className="text-lg font-semibold">Platform</h2>
        <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-6">
          <StatCard label="Users" value={formatNumber(totals.users)} href="/admin/users" />
          <StatCard label="Creators" value={formatNumber(totals.creators)} href="/admin/creators" />
          <StatCard label="Students" value={formatNumber(totals.students)} note="With at least one course" />
          <StatCard label="Courses" value={formatNumber(totals.courses)} href="/admin/courses" />
          <StatCard label="Live products" value={formatNumber(totals.liveProducts)} href="/admin/products" />
          <StatCard label="Platform fee, 30 days" value={nprFromPaisa(totals.platformFee30dPaisa)} href="/admin/commissions" />
        </div>
      </section>

      <div className="grid gap-8 xl:grid-cols-2">
        <section aria-labelledby="recent-payments" className="flex flex-col gap-3">
          <div className="flex items-end justify-between">
            <h2 id="recent-payments" className="text-lg font-semibold">Recent payments</h2>
            <Link href="/admin/purchases?status=all" className="text-sm text-primary hover:underline">All payments →</Link>
          </div>
          {purchases.length === 0 ? (
            <p className="text-sm text-muted-foreground">No payments yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>When</TableHead>
                  <TableHead>Buyer / product</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchases.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">{shortDateTime(p.createdAt)}</TableCell>
                    <TableCell className="text-sm">
                      <Link href={`/admin/purchases/${p.id}`} className="font-medium hover:underline">{p.product}</Link>
                      <div className="text-muted-foreground">{p.buyer} · {p.gateway}</div>
                    </TableCell>
                    <TableCell className="text-right text-sm">{nprFromPaisa(p.paisa)}</TableCell>
                    <TableCell><StatusBadge status={p.status} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </section>

        <section aria-labelledby="recent-signups" className="flex flex-col gap-3">
          <div className="flex items-end justify-between">
            <h2 id="recent-signups" className="text-lg font-semibold">Recent sign-ups</h2>
            <Link href="/admin/users" className="text-sm text-primary hover:underline">All users →</Link>
          </div>
          {signups.length === 0 ? (
            <p className="text-sm text-muted-foreground">No sign-ups yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>When</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Type</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {signups.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">{shortDateTime(u.createdAt)}</TableCell>
                    <TableCell className="text-sm">
                      <Link href={`/admin/users/${u.id}`} className="font-medium hover:underline">{u.name}</Link>
                      <div className="text-muted-foreground">{u.email}</div>
                    </TableCell>
                    <TableCell>{u.isCreator ? <StatusBadge status="paid" label="Creator" /> : <StatusBadge status="draft" label="Learner" />}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </section>
      </div>
    </div>
  )
}
