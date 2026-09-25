// Destination: apps/web/src/app/(consumer)/(support)/support/page.tsx
import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/services/auth";
import { getTicketsForUser } from "@/features/support/db/supportTickets";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/formatters";

export default async function SupportPage() {
  const currentUser = await getCurrentUser();
  if (currentUser.userId == null) redirect("/sign-in");

  const tickets = await getTicketsForUser(currentUser.userId);

  return (
    <div className="flex flex-col min-h-screen">
      {/* ---------------- HERO ---------------- */}
      <section className="relative overflow-hidden section-muted border-b py-14 md:py-20">

        <div className="container mx-auto px-4">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <h1 className="heading-display text-3xl sm:text-4xl">
              Support
            </h1>
            <Button asChild>
              <Link href="/support/new">New Ticket</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ---------------- CONTENT ---------------- */}
      <section className="container mx-auto px-4 py-10">
        <div className="mx-auto max-w-2xl">
          {tickets.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border bg-secondary/40 p-10 text-center">
              <p className="text-sm text-muted-foreground">
                No support tickets yet. Something wrong, or a question about
                your account or a purchase? Start a ticket and we&apos;ll get
                back to you.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {tickets.map((ticket) => (
                <Link key={ticket.id} href={`/support/${ticket.id}`}>
                  <Card className="border-border bg-card shadow-sm transition-colors hover:bg-accent">
                    <CardContent className="flex items-center justify-between gap-4 p-4">
                      <div>
                        <p className="text-sm font-medium">{ticket.subject}</p>
                        <p className="text-xs text-muted-foreground">
                          Last activity {formatDate(ticket.lastMessageAt)}
                        </p>
                      </div>
                      <Badge
                        variant={
                          ticket.status === "open" ? "default" : "secondary"
                        }
                        className="rounded-md"
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
      </section>
    </div>
  );
}
