import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { PageHeader } from "@/components/PageHeader"
import { getPendingPayouts } from "@/features/payouts/db/payouts"
import { PayoutRowActions } from "@/features/payouts/components/PayoutRowActions"
import { formatPrice } from "@/lib/formatters"

export default async function AdminPayoutsPage() {
  const payouts = await getPendingPayouts()

  return (
    <div className="container my-6 flex flex-col gap-6">
      <PageHeader title="Payout Requests" />

      {payouts.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No pending payout requests.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Instructor</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Bank Details</TableHead>
              <TableHead>Requested</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payouts.map(payout => (
              <TableRow key={payout.id}>
                <TableCell>
                  {/* ASSUMPTION: UserTable has name/email columns — adjust
                      if the real field names differ. Falls back to the raw
                      id so the row never renders blank either way. */}
                  {payout.instructor?.name ??
                    payout.instructor?.email ??
                    payout.instructorId}
                </TableCell>
                <TableCell>{formatPrice(payout.amountPaisa / 100)}</TableCell>
                <TableCell className="max-w-xs whitespace-pre-wrap text-sm text-muted-foreground">
                  {payout.bankDetailsSnapshot}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {new Date(payout.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-right">
                  <PayoutRowActions payoutId={payout.id} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
