import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { PageHeader } from "@/components/PageHeader"
import { getRefundRequestsForAdmin } from "@/features/refunds/db/refunds"
import {
  MarkMoneyReturnedButton,
  RefundRowActions,
} from "@/features/refunds/components/RefundRowActions"
import { requireAdmin } from "@/services/auth"

const npr = (paisa: number) => `NPR ${(paisa / 100).toLocaleString("en-IN")}`
const when = (date: Date | null) => (date ? new Date(date).toLocaleString() : "—")

type Row = Awaited<ReturnType<typeof getRefundRequestsForAdmin>>["pending"][number]

function PaymentCell({ row }: { row: Row }) {
  // What the admin needs to find the payment in the gateway's merchant
  // dashboard and return the money by hand.
  return (
    <div className="flex flex-col gap-0.5 text-sm">
      <span className="font-medium uppercase">{row.purchase.gateway}</span>
      <span className="text-muted-foreground">
        Transaction: <code className="text-xs">{row.purchase.gatewayTransactionId ?? "—"}</code>
      </span>
      <span className="text-muted-foreground">
        Checkout ref: <code className="text-xs">{row.purchase.gatewayCheckoutId ?? "—"}</code>
      </span>
      <span className="text-muted-foreground">
        Purchase: <code className="text-xs">{row.purchase.id}</code>
      </span>
    </div>
  )
}

export default async function AdminRefundsPage() {
  await requireAdmin()
  const { pending, decided } = await getRefundRequestsForAdmin()

  return (
    <div className="container my-6 flex flex-col gap-6">
      <PageHeader title="Refund Requests" />
      <p className="max-w-3xl text-sm text-muted-foreground">
        <strong>Approve &amp; revoke</strong> marks the purchase refunded,
        removes the buyer&apos;s access and reverses the creator&apos;s earnings,
        in one step. The money is <strong>not</strong> sent automatically:
        after approving, refund the amount in the gateway&apos;s merchant
        dashboard using the transaction ID shown. The buyer is emailed on
        approve and on reject.
      </p>

      <h2 className="text-lg font-semibold">Pending ({pending.length})</h2>
      {pending.length === 0 ? (
        <p className="text-sm text-muted-foreground">No pending refund requests.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Buyer</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Paid</TableHead>
              <TableHead>Gateway</TableHead>
              <TableHead>Request</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pending.map(row => (
              <TableRow key={row.id}>
                <TableCell className="text-sm">
                  {row.user.name}
                  <br />
                  <span className="text-muted-foreground">{row.user.email}</span>
                </TableCell>
                <TableCell className="text-sm">{row.purchase.productDetails.name}</TableCell>
                <TableCell className="text-sm">
                  {npr(row.purchase.pricePaidInPaisa)}
                  <br />
                  <span className="text-muted-foreground">{when(row.purchase.createdAt)}</span>
                </TableCell>
                <TableCell>
                  <PaymentCell row={row} />
                </TableCell>
                <TableCell className="max-w-xs text-sm">
                  <span className="text-muted-foreground">
                    {when(row.createdAt)} · {row.completionPercentAtRequest}% complete
                  </span>
                  {row.reason && <p className="whitespace-pre-wrap">{row.reason}</p>}
                </TableCell>
                <TableCell className="text-right">
                  <RefundRowActions requestId={row.id} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <h2 className="text-lg font-semibold">Recent decisions</h2>
      {decided.length === 0 ? (
        <p className="text-sm text-muted-foreground">None yet.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Buyer</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Paid</TableHead>
              <TableHead>Gateway</TableHead>
              <TableHead>Decision</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {decided.map(row => (
              <TableRow key={row.id}>
                <TableCell className="text-sm">
                  {row.user.name}
                  <br />
                  <span className="text-muted-foreground">{row.user.email}</span>
                </TableCell>
                <TableCell className="text-sm">{row.purchase.productDetails.name}</TableCell>
                <TableCell className="text-sm">{npr(row.purchase.pricePaidInPaisa)}</TableCell>
                <TableCell>
                  <PaymentCell row={row} />
                </TableCell>
                <TableCell className="max-w-xs text-sm">
                  <strong>{row.status === "denied" ? "Rejected" : "Approved"}</strong> by{" "}
                  {row.reviewer?.name ?? row.reviewer?.email ?? "—"} · {when(row.reviewedAt)}
                  {row.adminNote && (
                    <p className="whitespace-pre-wrap text-muted-foreground">{row.adminNote}</p>
                  )}
                  {row.status === "approved" && (
                    <div className="mt-2 flex flex-col gap-1">
                      <span className="text-muted-foreground">Money not yet marked as returned.</span>
                      <MarkMoneyReturnedButton requestId={row.id} />
                    </div>
                  )}
                  {row.status === "processed" && (
                    <p className="mt-1">
                      <strong>Money returned</strong> · marked by{" "}
                      {row.processor?.name ?? row.processor?.email ?? "—"} · {when(row.processedAt)}
                    </p>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
