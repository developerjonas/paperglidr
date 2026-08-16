// Destination: apps/web/src/app/(consumer)/support/page.tsx

import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/services/auth";
import { getTicketsForUser } from "@/features/support/db/supportTickets";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/formatters";

export default async function SupportPage() {
  const currentUser = await getCurrentUser();
  if (currentUser.userId == null) redirect("/sign-in");

  const tickets = await getTicketsForUser(currentUser.userId);

  return (
    <div className="container my-6 space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader title="Support" />
        <Button asChild>
          <Link href="/support/new">New Ticket</Link>
        </Button>
      </div>

      {tickets.length === 0 ? (
        <p className="text-muted-foreground">
          No support tickets yet. Something wrong, or a question about your
          account or a purchase? Start a ticket and we&apos;ll get back to you.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {tickets.map((ticket) => (
            <Link key={ticket.id} href={`/support/${ticket.id}`}>
              <Card className="transition-colors hover:border-primary/40">
                <CardContent className="flex items-center justify-between gap-4 p-4">
                  <div>
                    <p className="font-medium">{ticket.subject}</p>
                    <p className="text-xs text-muted-foreground">
                      Last activity {formatDate(ticket.lastMessageAt)}
                    </p>
                  </div>
                  <Badge
                    variant={ticket.status === "open" ? "default" : "secondary"}
                  >
                    {ticket.status.replace("_", " ")}
                  </Badge>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
