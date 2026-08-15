// Destination: apps/web/src/app/admin/support/page.tsx
// No role check added — assuming admin/layout.tsx already gates this
// route, same as your other /admin pages.

import Link from "next/link";
import { getAllTickets } from "@/features/support/db/supportTickets";
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
import { formatDate } from "@/lib/formatters";

export default async function AdminSupportPage() {
  const tickets = await getAllTickets();

  return (
    <div className="container my-6 space-y-6">
      <PageHeader title="Support Tickets" />

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Subject</TableHead>
            <TableHead>From</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Last Activity</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tickets.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={5}
                className="text-center text-muted-foreground"
              >
                No support tickets
              </TableCell>
            </TableRow>
          )}
          {tickets.map((ticket) => (
            <TableRow key={ticket.id}>
              <TableCell>
                <Link
                  href={`/admin/support/${ticket.id}`}
                  className="font-medium hover:underline"
                >
                  {ticket.subject}
                </Link>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {ticket.user?.name ?? ticket.user?.email ?? "Unknown"}
              </TableCell>
              <TableCell className="capitalize">{ticket.category}</TableCell>
              <TableCell>
                <Badge
                  variant={ticket.status === "open" ? "default" : "secondary"}
                >
                  {ticket.status.replace("_", " ")}
                </Badge>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {formatDate(ticket.lastMessageAt)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
