import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { PageHeader } from "@/components/PageHeader"
import { getCurrentUser } from "@/services/clerk"
import {
  getMyAvailableBalanceInRupees,
} from "@/features/payouts/actions/payouts"
import { getInstructorPayoutHistory } from "@/features/payouts/db/payouts"
import { PayoutRequestForm } from "@/features/payouts/components/PayoutRequestForm"
import { formatPrice } from "@/lib/formatters"

const STATUS_VARIANT: Record<string, "outline" | "default" | "destructive"> = {
  requested: "outline",
  paid: "default",
  rejected: "destructive",
}

export default async function TeachPayoutsPage() {
  const { userId, redirectToSignIn } = await getCurrentUser()
  if (userId == null) return redirectToSignIn()

  const [availableBalanceInRupees, history] = await Promise.all([
    getMyAvailableBalanceInRupees(),
    getInstructorPayoutHistory(userId),
  ])

  return (
    <div className="container my-6 flex flex-col gap-8">
      <PageHeader title="Payouts" />

      <div className="max-w-md">
        <PayoutRequestForm availableBalanceInRupees={availableBalanceInRupees} />
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-medium">Request History</h2>
        {history.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            You haven&apos;t requested a payout yet.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Requested</TableHead>
                <TableHead>Resolved</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.map(payout => (
                <TableRow key={payout.id}>
                  <TableCell>{formatPrice(payout.amountPaisa / 100)}</TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[payout.status] ?? "outline"}>
                      {payout.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(payout.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {payout.status === "paid" && payout.paidAt
                      ? new Date(payout.paidAt).toLocaleDateString()
                      : "—"}
                  </TableCell>
                  <TableCell className="max-w-xs whitespace-pre-wrap text-sm text-muted-foreground">
                    {payout.status === "rejected" ? payout.rejectedReason : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  )
}
