import Link from "next/link"
import { notFound } from "next/navigation"
import type { ReactNode } from "react"
import { ActionButton } from "@/components/ActionButton"
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { sendInvoiceNow } from "@/features/admin/actions/payments"
import { AdminPageHeader, StatusBadge, nprFromPaisa, shortDateTime } from "@/features/admin/components/AdminUi"
import { getPaymentDetail } from "@/features/admin/db/payments"
import { recheckPurchasePayment } from "@/features/purchases/actions/adminPurchases"
import { requireAdmin } from "@/services/auth"
import { getDownloadUrl } from "@/services/storage/r2"

const SOURCE_LABELS: Record<string, string> = {
  initiate: "Checkout started",
  return: "Buyer returned from gateway",
  poll: "Status poll",
  success_page: "Success page",
  cron: "Payment cron",
  admin: "Admin re-check",
}
const REVENUE_SOURCE_LABELS: Record<string, string> = { instructor_link: "Creator's link", platform: "Chiyali" }

function Section({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  return (
    <section className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-semibold">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0 break-words">{children}</dd>
    </>
  )
}

export default async function AdminPaymentPage({ params }: { params: Promise<{ purchaseId: string }> }) {
  await requireAdmin()
  const { purchaseId } = await params
  if (!/^[0-9a-f-]{36}$/i.test(purchaseId)) notFound()
  const p = await getPaymentDetail(purchaseId)
  if (p == null) notFound()

  const invoicePdfUrl = p.invoice?.pdfKey
    ? await getDownloadUrl({ storageKey: p.invoice.pdfKey, disposition: "inline", expirySeconds: 600 }).catch(() => null)
    : null
  const sales = p.ledger.filter((l) => l.entryType === "sale")
  const totals = p.ledger.reduce(
    (t, l) => ({ gross: t.gross + l.grossPaisa, fee: t.fee + l.feePaisa, earnings: t.earnings + l.earningsPaisa }),
    { gross: 0, fee: 0, earnings: 0 },
  )
  const canRecheck = (p.status === "pending" || p.status === "failed") && p.gateway !== "free"

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/admin/purchases" className="text-sm text-muted-foreground hover:underline">
          ← Payments
        </Link>
      </div>
      <AdminPageHeader
        title={`${nprFromPaisa(p.paisa)} · ${p.productName}`}
        description={
          <>
            {shortDateTime(p.createdAt)} via <span className="capitalize">{p.gateway}</span> · bought by{" "}
            <Link href={`/admin/users/${p.userId}`} className="text-primary hover:underline">
              {p.buyerDeleted ? "a deleted user" : `${p.buyer} (${p.buyerEmail})`}
            </Link>
          </>
        }
      >
        <StatusBadge status={p.status} />
        {canRecheck && (
          <ActionButton action={recheckPurchasePayment.bind(null, p.id)} size="sm">
            Re-check payment
          </ActionButton>
        )}
      </AdminPageHeader>

      {p.status === "disputed" && (
        <p className="rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm">
          <strong>Disputed:</strong> the gateway&apos;s amount or transaction didn&apos;t match this purchase, so no access was given. Check the
          transaction in the {p.gateway} merchant dashboard. If the buyer really paid the right amount, give them the course from their user page
          and note it on a support ticket; if not, leave it.
        </p>
      )}

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="flex flex-col gap-6 xl:col-span-2">
          <Section title="Commission split" action={<Link href="/admin/commissions" className="text-sm text-primary hover:underline">Commissions →</Link>}>
            {p.ledger.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {p.status === "completed" && p.paisa > 0 ? "No ledger entries: this needs checking." : "No ledger entries (only paid, completed purchases have them)."}
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Entry</TableHead>
                    <TableHead>Course · creator</TableHead>
                    <TableHead>Sale via</TableHead>
                    <TableHead className="text-right">Gross</TableHead>
                    <TableHead className="text-right">Chiyali fee</TableHead>
                    <TableHead className="text-right">Creator</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {p.ledger.map((l) => (
                    <TableRow key={l.id}>
                      <TableCell>
                        <StatusBadge status={l.entryType === "sale" ? "completed" : "refunded"} label={l.entryType} />
                      </TableCell>
                      <TableCell className="text-sm">
                        {l.course}
                        <p className="text-xs text-muted-foreground">
                          <Link href={`/admin/users/${l.creatorId}`} className="hover:underline">
                            {l.creator}
                          </Link>
                        </p>
                      </TableCell>
                      <TableCell className="text-sm">
                        {REVENUE_SOURCE_LABELS[l.source] ?? l.source}
                        <p className="text-xs text-muted-foreground">fee {(l.feeBps / 100).toFixed(l.feeBps % 100 ? 1 : 0)}%</p>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{nprFromPaisa(l.grossPaisa)}</TableCell>
                      <TableCell className="text-right tabular-nums">{nprFromPaisa(l.feePaisa)}</TableCell>
                      <TableCell className="text-right tabular-nums">{nprFromPaisa(l.earningsPaisa)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                {p.ledger.length > 1 && (
                  <TableFooter>
                    <TableRow>
                      <TableCell colSpan={3}>Net{sales.length !== p.ledger.length && " (after refund)"}</TableCell>
                      <TableCell className="text-right tabular-nums">{nprFromPaisa(totals.gross)}</TableCell>
                      <TableCell className="text-right tabular-nums">{nprFromPaisa(totals.fee)}</TableCell>
                      <TableCell className="text-right tabular-nums">{nprFromPaisa(totals.earnings)}</TableCell>
                    </TableRow>
                  </TableFooter>
                )}
              </Table>
            )}
          </Section>

          <Section title="Gateway events">
            {p.events.length === 0 ? (
              <p className="text-sm text-muted-foreground">No events recorded.</p>
            ) : (
              <ol className="flex flex-col gap-3 border-l border-border pl-4">
                {p.events.map((e) => (
                  <li key={e.id} className="relative text-sm">
                    <span className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-border" aria-hidden />
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge status={e.outcome} />
                      <span className="font-medium">{SOURCE_LABELS[e.source] ?? e.source}</span>
                      <span className="text-muted-foreground">{shortDateTime(e.createdAt)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {e.gatewayStatus && `Gateway said “${e.gatewayStatus}”`}
                      {e.paisa != null && ` · ${nprFromPaisa(e.paisa)}`}
                      {e.paisa != null && e.paisa !== p.paisa && " (≠ price)"}
                    </p>
                    {e.detail != null && (
                      <details className="mt-1">
                        <summary className="cursor-pointer text-xs text-muted-foreground">Details</summary>
                        <pre className="mt-1 max-h-48 overflow-auto rounded bg-muted p-2 text-xs">{JSON.stringify(e.detail, null, 2)}</pre>
                      </details>
                    )}
                  </li>
                ))}
              </ol>
            )}
          </Section>

          {p.refunds.length > 0 && (
            <Section title="Refund requests" action={<Link href="/admin/refunds" className="text-sm text-primary hover:underline">Refunds →</Link>}>
              <ul className="flex flex-col gap-3 text-sm">
                {p.refunds.map((r) => (
                  <li key={r.id} className="flex flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge status={r.status} />
                      <span className="text-muted-foreground">asked {shortDateTime(r.createdAt)}</span>
                      {r.reviewedAt && <span className="text-muted-foreground">· reviewed {shortDateTime(r.reviewedAt)}</span>}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {r.completion}% watched · {r.withinWindow ? "within" : "outside"} the refund window · {r.eligible ? "eligible" : "not eligible"}
                    </p>
                    {r.reason && <p>“{r.reason}”</p>}
                    {r.adminNote && <p className="text-xs text-muted-foreground">Admin note: {r.adminNote}</p>}
                  </li>
                ))}
              </ul>
            </Section>
          )}
        </div>

        <div className="flex flex-col gap-6">
          <Section title="Payment">
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
              <Field label="Price paid">{nprFromPaisa(p.paisa)}</Field>
              {p.discountPaisa > 0 && (
                <Field label="Discount">
                  {nprFromPaisa(p.discountPaisa)}
                  {p.discountCode && <span className="ml-1 font-mono text-xs">({p.discountCode})</span>}
                </Field>
              )}
              <Field label="Referred by">
                {p.referredBy ? (
                  <Link href={`/admin/users/${p.referredBy.id}`} className="text-primary hover:underline">
                    {p.referredBy.name}
                  </Link>
                ) : (
                  "—"
                )}
              </Field>
              <Field label="Product">
                <Link href={`/products/${p.productId}`} className="text-primary hover:underline">
                  {p.productName}
                </Link>
                {p.productStatus && p.productStatus !== "public" && <span className="text-muted-foreground"> (now {p.productStatus.replace("_", " ")})</span>}
              </Field>
              <Field label="Purchase ID">
                <span className="font-mono text-xs">{p.id}</span>
              </Field>
              <Field label="Checkout ID">
                <span className="font-mono text-xs">{p.checkoutId}</span>
              </Field>
              <Field label="Transaction ID">
                <span className="font-mono text-xs">{p.transactionId ?? "—"}</span>
              </Field>
              {p.expiresAt && <Field label="Checkout expires">{shortDateTime(p.expiresAt)}</Field>}
              <Field label="Last updated">{shortDateTime(p.updatedAt)}</Field>
              {p.refundedAt && <Field label="Refunded">{shortDateTime(p.refundedAt)}</Field>}
              {p.refundReason && <Field label="Refund reason">{p.refundReason}</Field>}
            </dl>
            {p.rawGatewayResponse != null && (
              <details>
                <summary className="cursor-pointer text-xs text-muted-foreground">Gateway response</summary>
                <pre className="mt-1 max-h-64 overflow-auto rounded bg-muted p-2 text-xs">{JSON.stringify(p.rawGatewayResponse, null, 2)}</pre>
              </details>
            )}
          </Section>

          <Section title="Invoice">
            {p.invoice == null ? (
              <p className="text-sm text-muted-foreground">No invoice (made when a paid purchase completes).</p>
            ) : (
              <>
                <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
                  <Field label="Number">
                    <span className="font-mono">{p.invoice.number}</span>
                  </Field>
                  <Field label="Total">{nprFromPaisa(p.invoice.totalPaisa)}</Field>
                  <Field label="Status">
                    <StatusBadge status={p.invoice.status} />
                  </Field>
                  <Field label="Emailed">{p.invoice.emailedAt ? shortDateTime(p.invoice.emailedAt) : `Not yet (${p.invoice.attempts} attempt(s))`}</Field>
                  {p.invoice.lastError && !p.invoice.emailedAt && (
                    <Field label="Last error">
                      <span className="text-xs text-destructive">{p.invoice.lastError}</span>
                    </Field>
                  )}
                </dl>
                <div className="flex flex-wrap gap-2">
                  {invoicePdfUrl && (
                    <a href={invoicePdfUrl} target="_blank" rel="noreferrer" className="text-sm text-primary hover:underline">
                      Open PDF
                    </a>
                  )}
                  {!p.invoice.emailedAt && (
                    <ActionButton action={sendInvoiceNow.bind(null, p.id)} size="sm" variant="outline">
                      Send invoice now
                    </ActionButton>
                  )}
                </div>
              </>
            )}
          </Section>
        </div>
      </div>
    </div>
  )
}
