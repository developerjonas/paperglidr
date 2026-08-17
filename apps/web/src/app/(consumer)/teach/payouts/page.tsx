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
import { getMyAvailableBalanceInRupees } from "@/features/payouts/actions/payouts";
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

  const [availableBalanceInRupees, history] = await Promise.all([
    getMyAvailableBalanceInRupees(),
    getInstructorPayoutHistory(userId),
  ]);

  return (
    <div className="flex flex-col min-h-screen">
      {/* ---------------- HERO ---------------- */}
      <section className="relative overflow-hidden border-b border-white/10 bg-gradient-to-b from-primary/5 via-background to-background py-14 md:py-20">
        <div className="absolute top-0 left-1/2 -z-10 h-[280px] w-[480px] -translate-x-1/2 rounded-full bg-primary/10 blur-[120px]" />
        <div className="container mx-auto px-4">
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
            Payouts
          </h1>
        </div>
      </section>

      {/* ---------------- CONTENT ---------------- */}
      <section className="container mx-auto px-4 py-10">
        <div className="flex flex-col gap-8">
          <div className="max-w-md">
            <Card className="border-white/30 bg-white/60 shadow-sm backdrop-blur-2xl backdrop-saturate-150 dark:border-white/10 dark:bg-black/40">
              <CardContent className="pt-6">
                <PayoutRequestForm
                  availableBalanceInRupees={availableBalanceInRupees}
                />
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold px-1">Request History</h2>
            {history.length === 0 ? (
              <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-white/30 bg-white/30 p-10 text-center backdrop-blur-md dark:border-white/10 dark:bg-white/[0.02]">
                <p className="text-sm text-muted-foreground">
                  You haven&apos;t requested a payout yet.
                </p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-white/30 bg-white/60 shadow-sm backdrop-blur-2xl backdrop-saturate-150 dark:border-white/10 dark:bg-black/40">
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/20 dark:border-white/10 hover:bg-transparent">
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
                        className="border-white/20 dark:border-white/10"
                      >
                        <TableCell>
                          {formatPrice(payout.amountPaisa / 100)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={STATUS_VARIANT[payout.status] ?? "outline"}
                            className="rounded-[4px]"
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
