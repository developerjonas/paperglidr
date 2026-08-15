import {
  getRevenueSummary,
  getRevenueByMonth,
  getRevenueBySource,
} from "@/features/ledger/db/revenue";
import { formatPrice } from "@/lib/formatters";

function formatPaisa(paisa: number) {
  return formatPrice(paisa / 100);
}
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function AdminRevenuePage() {
  const [summary, byMonth, bySource] = await Promise.all([
    getRevenueSummary(),
    getRevenueByMonth(6),
    getRevenueBySource(),
  ]);

  return (
    <div className="container my-6 space-y-6">
      <PageHeader title="Revenue" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryCard label="Gross Sales" valuePaisa={summary.grossPaisa} />
        <SummaryCard
          label="Platform Revenue"
          valuePaisa={summary.platformFeePaisa}
        />
        <SummaryCard
          label="Instructor Earnings"
          valuePaisa={summary.creatorEarningsPaisa}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Monthly Revenue</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Month</TableHead>
                <TableHead className="text-right">Gross</TableHead>
                <TableHead className="text-right">Platform Fee</TableHead>
                <TableHead className="text-right">
                  Instructor Earnings
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {byMonth.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center text-muted-foreground"
                  >
                    No sales yet
                  </TableCell>
                </TableRow>
              )}
              {byMonth.map((row) => (
                <TableRow key={row.month}>
                  <TableCell>{row.month}</TableCell>
                  <TableCell className="text-right">
                    {formatPaisa(row.grossPaisa)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatPaisa(row.platformFeePaisa)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatPaisa(row.creatorEarningsPaisa)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Revenue by Source</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Source</TableHead>
                <TableHead className="text-right">Sales</TableHead>
                <TableHead className="text-right">Gross</TableHead>
                <TableHead className="text-right">Platform Fee</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bySource.map((row) => (
                <TableRow key={row.revenueSource}>
                  <TableCell>
                    {row.revenueSource === "instructor_link"
                      ? "Instructor Referral"
                      : "Platform"}
                  </TableCell>
                  <TableCell className="text-right">{row.count}</TableCell>
                  <TableCell className="text-right">
                    {formatPaisa(row.grossPaisa)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatPaisa(row.platformFeePaisa)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryCard({
  label,
  valuePaisa,
}: {
  label: string;
  valuePaisa: number;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-normal text-muted-foreground">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold">{formatPaisa(valuePaisa)}</p>
      </CardContent>
    </Card>
  );
}
