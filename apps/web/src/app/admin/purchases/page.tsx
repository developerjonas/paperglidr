import Link from "next/link"
import { ActionButton } from "@/components/ActionButton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  AdminPageHeader,
  FilterTabs,
  Pager,
  SearchForm,
  StatCard,
  StatusBadge,
  nprFromPaisa,
  shortDateTime,
  gatewayName,
} from "@/features/admin/components/AdminUi"
import {
  PAYMENT_GATEWAYS,
  PAYMENT_STATUSES,
  type PaymentGatewayFilter,
  type PaymentStatusFilter,
  getPaymentSummary,
  listPayments,
} from "@/features/admin/db/payments"
import { recheckPurchasePayment } from "@/features/purchases/actions/adminPurchases"
import { requireAdmin } from "@/services/auth"

const STATUS_LABELS: Record<PaymentStatusFilter, string> = {
  all: "All",
  pending: "Pending",
  completed: "Completed",
  failed: "Failed",
  disputed: "Disputed",
  refunded: "Refunded",
}
const GATEWAY_LABELS: Record<PaymentGatewayFilter, string> = {
  all: "Any gateway",
  esewa: "eSewa",
  khalti: "Khalti",
  fonepay: "Fonepay",
  bank: "Bank",
  free: "Free",
}

export default async function AdminPaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; gateway?: string; q?: string; page?: string }>
}) {
  await requireAdmin()
  const params = await searchParams
  const status: PaymentStatusFilter = (PAYMENT_STATUSES as readonly string[]).includes(params.status ?? "")
    ? (params.status as PaymentStatusFilter)
    : "all"
  const gateway: PaymentGatewayFilter = (PAYMENT_GATEWAYS as readonly string[]).includes(params.gateway ?? "")
    ? (params.gateway as PaymentGatewayFilter)
    : "all"
  const q = params.q?.trim() || undefined
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1)

  const [{ rows, hasMore }, summary] = await Promise.all([listPayments({ q, status, gateway, page }), getPaymentSummary()])
  const href = (next: { status?: string; gateway?: string; page?: number }) => {
    const search = new URLSearchParams()
    const s = next.status ?? status
    const g = next.gateway ?? gateway
    if (s !== "all") search.set("status", s)
    if (g !== "all") search.set("gateway", g)
    if (q) search.set("q", q)
    if (next.page && next.page > 1) search.set("page", String(next.page))
    const str = search.toString()
    return str ? `/admin/purchases?${str}` : "/admin/purchases"
  }

  return (
    <div className="flex flex-col gap-4">
      <AdminPageHeader
        title="Payments"
        description="Every checkout. The payment cron re-checks pending ones with the gateway every 5 minutes; “Re-check payment” asks the gateway now. Open a payment for its gateway events, the commission split, the invoice and any refund."
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Taken, last 30 days" value={nprFromPaisa(summary.taken30dPaisa)} note={`${summary.paid30d} paid purchase(s)`} />
        <StatCard
          label="Stuck pending (over 1 hour)"
          value={summary.stuck}
          note="The cron should settle these; re-check if they stay"
          href="/admin/purchases?status=pending"
        />
        <StatCard label="Disputed" value={summary.counts.disputed} note="Amount or transaction mismatch: check by hand" href="/admin/purchases?status=disputed" />
        <StatCard label="Failed, last 30 days" value={summary.failed30d} href="/admin/purchases?status=failed" />
      </div>

      <div className="flex flex-col gap-3">
        <FilterTabs
          label="Payment status"
          current={status}
          hrefFor={(value) => href({ status: value, page: 1 })}
          options={PAYMENT_STATUSES.map((value) => ({ value, label: STATUS_LABELS[value], count: summary.counts[value] }))}
        />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <FilterTabs
            label="Gateway"
            current={gateway}
            hrefFor={(value) => href({ gateway: value, page: 1 })}
            options={PAYMENT_GATEWAYS.map((value) => ({ value, label: GATEWAY_LABELS[value] }))}
          />
          <SearchForm
            placeholder="Email, product, purchase or gateway ID"
            value={q}
            hidden={{ status: status === "all" ? undefined : status, gateway: gateway === "all" ? undefined : gateway }}
          />
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          {q ? `No payments match "${q}".` : "No payments here."}
        </p>
      ) : (
        <div className="rounded-xl border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>When</TableHead>
                <TableHead>Buyer</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Gateway</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last gateway event</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                    <Link href={`/admin/purchases/${p.id}`} className="hover:underline">
                      {shortDateTime(p.createdAt)}
                    </Link>
                  </TableCell>
                  <TableCell className="text-sm">
                    <Link href={`/admin/users/${p.userId}`} className="hover:underline">
                      {p.buyer}
                    </Link>
                    <p className="text-xs text-muted-foreground">{p.buyerEmail}</p>
                  </TableCell>
                  <TableCell className="max-w-56 text-sm">
                    <Link href={`/admin/purchases/${p.id}`} className="font-medium hover:underline">
                      {p.product}
                    </Link>
                  </TableCell>
                  <TableCell className="text-sm">{gatewayName(p.gateway)}</TableCell>
                  <TableCell className="text-right tabular-nums">{nprFromPaisa(p.paisa)}</TableCell>
                  <TableCell>
                    <StatusBadge status={p.status} />
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{p.lastEvent ?? "none"}</TableCell>
                  <TableCell className="text-right">
                    {(p.status === "pending" || p.status === "failed") && p.gateway !== "free" && (
                      <ActionButton variant="outline" size="sm" action={recheckPurchasePayment.bind(null, p.id)}>
                        Re-check
                      </ActionButton>
                    )}
                  </TableCell>
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
