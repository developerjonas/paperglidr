import Link from "next/link";
import { desc, eq, inArray } from "drizzle-orm";
import { ActionButton } from "@/components/ActionButton";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { db } from "@/drizzle/db";
import { PaymentEventTable, PurchaseTable } from "@/drizzle/schema";
import { recheckPurchasePayment } from "@/features/purchases/actions/adminPurchases";
import { formatDate, formatPrice } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { requireAdmin } from "@/services/auth";

const STATUS_FILTERS = ["pending", "disputed", "failed", "completed"] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

const PAGE_SIZE = 100;

export default async function AdminPurchasesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireAdmin();
  const { status: rawStatus } = await searchParams;
  const status: StatusFilter = STATUS_FILTERS.includes(rawStatus as StatusFilter)
    ? (rawStatus as StatusFilter)
    : "pending";

  const purchases = await db.query.PurchaseTable.findMany({
    where: eq(PurchaseTable.status, status),
    orderBy: desc(PurchaseTable.createdAt),
    limit: PAGE_SIZE,
    with: { user: { columns: { email: true } } },
  });

  const events =
    purchases.length === 0
      ? []
      : await db
          .select()
          .from(PaymentEventTable)
          .where(inArray(PaymentEventTable.purchaseId, purchases.map(p => p.id)))
          .orderBy(desc(PaymentEventTable.createdAt));
  const latestEvent = new Map<string, (typeof events)[number]>();
  for (const event of events) {
    if (!latestEvent.has(event.purchaseId)) latestEvent.set(event.purchaseId, event);
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Purchases" />

      <nav className="flex flex-wrap gap-2" aria-label="Filter by status">
        {STATUS_FILTERS.map(filter => (
          <Link
            key={filter}
            href={`/admin/purchases?status=${filter}`}
            aria-current={filter === status ? "page" : undefined}
            className={cn(
              "rounded-lg border px-3 py-1 text-sm capitalize",
              filter === status
                ? "border-primary bg-primary text-primary-foreground"
                : "hover:bg-muted",
            )}
          >
            {filter}
          </Link>
        ))}
      </nav>

      {purchases.length === 0 ? (
        <p className="text-sm text-muted-foreground">No {status} purchases.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Created</TableHead>
              <TableHead>Buyer</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Gateway</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Last gateway event</TableHead>
              <TableHead>Reference</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {purchases.map(purchase => {
              const event = latestEvent.get(purchase.id);
              return (
                <TableRow key={purchase.id}>
                  <TableCell className="whitespace-nowrap">
                    {formatDate(purchase.createdAt)}
                  </TableCell>
                  <TableCell>{purchase.user.email}</TableCell>
                  <TableCell>{purchase.productDetails.name}</TableCell>
                  <TableCell className="capitalize">{purchase.gateway}</TableCell>
                  <TableCell>{formatPrice(purchase.pricePaidInPaisa / 100)}</TableCell>
                  <TableCell>
                    {event ? (
                      <div className="flex flex-col gap-0.5">
                        <Badge variant="outline" className="w-fit">
                          {event.outcome}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {event.source}
                          {event.gatewayStatus ? ` · ${event.gatewayStatus}` : ""}
                          {event.amountInPaisa != null
                            ? ` · ${formatPrice(event.amountInPaisa / 100)}`
                            : ""}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">none</span>
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    <div>{purchase.id}</div>
                    <div className="text-muted-foreground">{purchase.gatewayCheckoutId}</div>
                  </TableCell>
                  <TableCell>
                    {(purchase.status === "pending" || purchase.status === "failed") &&
                      purchase.gateway !== "free" && (
                        <ActionButton
                          variant="outline"
                          size="sm"
                          action={recheckPurchasePayment.bind(null, purchase.id)}
                        >
                          Re-check payment
                        </ActionButton>
                      )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
      {purchases.length === PAGE_SIZE && (
        <p className="text-xs text-muted-foreground">
          Showing the newest {PAGE_SIZE}.
        </p>
      )}
    </div>
  );
}
