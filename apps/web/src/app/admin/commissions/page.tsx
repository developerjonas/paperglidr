import Link from "next/link"
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AdminPageHeader, FilterTabs, StatCard, StatusBadge, nprFromPaisa, shortDateTime } from "@/features/admin/components/AdminUi"
import { COMMISSION_PERIODS, type CommissionPeriod, getCreatorCommissions, getCreatorLedger } from "@/features/admin/db/commissions"
import { MINIMUM_PAYOUT_PAISA } from "@/features/payouts/db/payouts"
import { REFUND_WINDOW_MS } from "@/features/refunds/lib/refundTerms"
import { requireAdmin } from "@/services/auth"

const PERIOD_LABELS: Record<CommissionPeriod, string> = { "30d": "30 days", "90d": "90 days", "365d": "12 months", all: "All time" }
const holdDays = Math.round(REFUND_WINDOW_MS / 86_400_000)

export default async function AdminCommissionsPage({ searchParams }: { searchParams: Promise<{ period?: string; creator?: string }> }) {
  await requireAdmin()
  const params = await searchParams
  const period: CommissionPeriod = (COMMISSION_PERIODS as readonly string[]).includes(params.period ?? "") ? (params.period as CommissionPeriod) : "all"
  const creatorId = params.creator && /^[0-9a-f-]{36}$/i.test(params.creator) ? params.creator : undefined
  const [creators, ledger] = await Promise.all([
    getCreatorCommissions({ period, creatorId }),
    creatorId ? getCreatorLedger(creatorId) : Promise.resolve(null),
  ])
  const total = creators.reduce(
    (t, c) => ({
      gross: t.gross + c.grossPaisa,
      fee: t.fee + c.platformFeePaisa,
      earnings: t.earnings + c.earningsPaisa,
      paidOut: t.paidOut + c.paidOutPaisa,
      requested: t.requested + c.requestedPaisa,
      held: t.held + c.heldPaisa,
      available: t.available + Math.max(c.availablePaisa, 0),
    }),
    { gross: 0, fee: 0, earnings: 0, paidOut: 0, requested: 0, held: 0, available: 0 },
  )
  const href = (next: { period?: string }) => {
    const search = new URLSearchParams()
    const p = next.period ?? period
    if (p !== "all") search.set("period", p)
    if (creatorId) search.set("creator", creatorId)
    const s = search.toString()
    return s ? `/admin/commissions?${s}` : "/admin/commissions"
  }
  const one = creatorId ? creators[0] : undefined

  return (
    <div className="flex flex-col gap-4">
      {creatorId && (
        <div>
          <Link href="/admin/commissions" className="text-sm text-muted-foreground hover:underline">
            ← All creators
          </Link>
        </div>
      )}
      <AdminPageHeader
        title={one ? `Commissions · ${one.name}` : "Commissions"}
        description={
          <>
            Each creator&apos;s sales, Chiyali&apos;s fee and what they&apos;re owed, from the ledger (refunds included as reversals). Earnings are
            held for {holdDays} days (the refund window) before they can be withdrawn; creators request payouts of at least{" "}
            {nprFromPaisa(MINIMUM_PAYOUT_PAISA)}, which you pay in{" "}
            <Link href="/admin/payouts" className="text-primary hover:underline">
              Payouts
            </Link>
            .
          </>
        }
      />
      <FilterTabs
        label="Period"
        current={period}
        hrefFor={(value) => href({ period: value })}
        options={COMMISSION_PERIODS.map((value) => ({ value, label: PERIOD_LABELS[value] }))}
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label={`Gross sales · ${PERIOD_LABELS[period].toLowerCase()}`} value={nprFromPaisa(total.gross)} note="Net of refunds" />
        <StatCard label="Chiyali's fee" value={nprFromPaisa(total.fee)} note={total.gross > 0 ? `${Math.round((100 * total.fee) / total.gross)}% of gross` : undefined} />
        <StatCard label="Creators' earnings" value={nprFromPaisa(total.earnings)} />
        <StatCard
          label="Owed now"
          value={nprFromPaisa(total.available + total.requested)}
          note={`${nprFromPaisa(total.requested)} requested · ${nprFromPaisa(total.held)} more held`}
          href="/admin/payouts"
        />
      </div>

      {creators.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">No sales yet.</p>
      ) : (
        <div className="rounded-xl border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Creator</TableHead>
                <TableHead className="text-right">Sales</TableHead>
                <TableHead className="text-right">Gross</TableHead>
                <TableHead className="text-right">Via their link</TableHead>
                <TableHead className="text-right">Chiyali fee</TableHead>
                <TableHead className="text-right">Earnings</TableHead>
                <TableHead className="text-right">Paid out</TableHead>
                <TableHead className="text-right">Requested</TableHead>
                <TableHead className="text-right">Held</TableHead>
                <TableHead className="text-right">Available</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {creators.map((c) => (
                <TableRow key={c.creatorId}>
                  <TableCell>
                    <Link href={`/admin/commissions?creator=${c.creatorId}`} className="font-medium hover:underline">
                      {c.name}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      <Link href={`/admin/users/${c.creatorId}`} className="hover:underline">
                        {c.handle ? `@${c.handle}` : c.email}
                      </Link>
                    </p>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {c.sales}
                    {c.refunds > 0 && <span className="block text-xs text-muted-foreground">{c.refunds} refunded</span>}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{nprFromPaisa(c.grossPaisa)}</TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">{nprFromPaisa(c.viaCreatorLinkPaisa)}</TableCell>
                  <TableCell className="text-right tabular-nums">{nprFromPaisa(c.platformFeePaisa)}</TableCell>
                  <TableCell className="text-right tabular-nums">{nprFromPaisa(c.earningsPaisa)}</TableCell>
                  <TableCell className="text-right tabular-nums">{nprFromPaisa(c.paidOutPaisa)}</TableCell>
                  <TableCell className="text-right tabular-nums">{c.requestedPaisa > 0 ? nprFromPaisa(c.requestedPaisa) : "—"}</TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">{nprFromPaisa(c.heldPaisa)}</TableCell>
                  <TableCell className={`text-right font-medium tabular-nums ${c.availablePaisa < 0 ? "text-destructive" : ""}`}>
                    {nprFromPaisa(c.availablePaisa)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            {creators.length > 1 && (
              <TableFooter>
                <TableRow>
                  <TableCell>Total</TableCell>
                  <TableCell />
                  <TableCell className="text-right tabular-nums">{nprFromPaisa(total.gross)}</TableCell>
                  <TableCell />
                  <TableCell className="text-right tabular-nums">{nprFromPaisa(total.fee)}</TableCell>
                  <TableCell className="text-right tabular-nums">{nprFromPaisa(total.earnings)}</TableCell>
                  <TableCell className="text-right tabular-nums">{nprFromPaisa(total.paidOut)}</TableCell>
                  <TableCell className="text-right tabular-nums">{nprFromPaisa(total.requested)}</TableCell>
                  <TableCell className="text-right tabular-nums">{nprFromPaisa(total.held)}</TableCell>
                  <TableCell className="text-right tabular-nums">{nprFromPaisa(total.available)}</TableCell>
                </TableRow>
              </TableFooter>
            )}
          </Table>
        </div>
      )}
      <p className="text-xs text-muted-foreground">
        A negative Available means a refund came after the money was paid out; it comes off their next earnings.
      </p>

      {ledger && (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">Ledger (latest 100)</h2>
          {ledger.length === 0 ? (
            <p className="text-sm text-muted-foreground">No entries.</p>
          ) : (
            <div className="rounded-xl border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>When</TableHead>
                    <TableHead>Entry</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>Via</TableHead>
                    <TableHead className="text-right">Gross</TableHead>
                    <TableHead className="text-right">Fee</TableHead>
                    <TableHead className="text-right">Earnings</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ledger.map((l) => (
                    <TableRow key={l.id}>
                      <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                        <Link href={`/admin/purchases/${l.purchaseId}`} className="hover:underline">
                          {shortDateTime(l.createdAt)}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={l.entryType === "sale" ? "completed" : "refunded"} label={l.entryType} />
                      </TableCell>
                      <TableCell className="text-sm">{l.course}</TableCell>
                      <TableCell className="text-sm">
                        {l.source === "instructor_link" ? "Their link" : "Chiyali"} · {(l.feeBps / 100).toFixed(l.feeBps % 100 ? 1 : 0)}%
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{nprFromPaisa(l.grossPaisa)}</TableCell>
                      <TableCell className="text-right tabular-nums">{nprFromPaisa(l.feePaisa)}</TableCell>
                      <TableCell className="text-right tabular-nums">{nprFromPaisa(l.earningsPaisa)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </section>
      )}
    </div>
  )
}
