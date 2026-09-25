import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { getCurrentUser } from "@/services/auth";
import { getMyBalancesInRupees } from "@/features/payouts/actions/payouts";
import { getInstructorByUserId } from "@/features/instructors/db/instructors";
import { POLICY_TERMS } from "@/config/policyTerms";
import Link from "next/link";
import { getInstructorPayoutHistory } from "@/features/payouts/db/payouts";
import { PayoutRequestForm } from "@/features/payouts/components/PayoutRequestForm";
import { formatPrice } from "@/lib/formatters";
import { Card, CardContent } from "@/components/ui/card";

const STATUS_VARIANT: Record<string, "outline" | "default" | "destructive"> = {
  requested: "outline",
  paid: "default",
  rejected: "destructive",
};

export default async function TeachPayoutsPage() {
  const { userId, redirectToSignIn } = await getCurrentUser();
  if (userId == null) return redirectToSignIn();

  const [balances, history, instructor] = await Promise.all([
    getMyBalancesInRupees(),
    getInstructorPayoutHistory(userId),
    getInstructorByUserId(userId),
  ]);
  const phoneVerified = instructor?.phoneVerifiedAt != null;

  return (
    <div className="flex flex-col min-h-screen">
      {/* ---------------- HERO ---------------- */}
      <section className="relative overflow-hidden section-muted border-b py-14 md:py-20">
        <div className="container mx-auto px-4">
          <h1 className="heading-display text-3xl sm:text-4xl">
            Payouts
          </h1>
        </div>
      </section>

      {/* ---------------- CONTENT ---------------- */}
      <section className="container mx-auto px-4 py-10">
        <div className="flex flex-col gap-8">
          <div className="max-w-md">
            <Card className="border-border bg-card shadow-sm">
              <CardContent className="pt-6">
                {POLICY_TERMS.payoutRequiresVerifiedPhone && !phoneVerified ? (
                  <div className="flex flex-col gap-2 text-sm">
                    <p>
                      Available to withdraw:{" "}
                      <strong>NPR {balances.available.toFixed(2)}</strong>
                      {" · "}On hold: NPR {balances.held.toFixed(2)}
                    </p>
                    <p className="text-muted-foreground">
                      Verify your phone number to request payouts.
                    </p>
                    <Link
                      href="/instructors/onboarding#verify"
                      className="font-medium text-primary underline-offset-4 hover:underline"
                    >
                      Verify your phone
                    </Link>
                  </div>
                ) : (
                  <PayoutRequestForm
                    availableBalanceInRupees={balances.available}
                    heldBalanceInRupees={balances.held}
                    holdDays={POLICY_TERMS.payoutHoldDays}
                    minimumPayout={POLICY_TERMS.minimumPayout}
                  />
                )}
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold px-1">Request History</h2>
            {history.length === 0 ? (
              <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border bg-secondary/40 p-10 text-center">
                <p className="text-sm text-muted-foreground">
                  You haven&apos;t requested a payout yet.
                </p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Requested</TableHead>
                      <TableHead>Resolved</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {history.map((payout) => (
                      <TableRow
                        key={payout.id}
                        className="border-border"
                      >
                        <TableCell>
                          {formatPrice(payout.amountPaisa / 100)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={STATUS_VARIANT[payout.status] ?? "outline"}
                            className="rounded-md"
                          >
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
                          {payout.status === "rejected"
                            ? payout.rejectedReason
                            : "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
