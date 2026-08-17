// Destination: apps/web/src/app/(consumer)/support/[ticketId]/page.tsx
import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/services/auth";
import { getTicketWithMessages } from "@/features/support/db/supportTickets";
import { canViewTicket } from "@/features/support/permissions/supportTickets";
import { SupportTicketThread } from "@/features/support/components/SupportTicketThread";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export default async function SupportTicketPage({
  params,
}: {
  params: Promise<{ ticketId: string }>;
}) {
  const { ticketId } = await params;
  const currentUser = await getCurrentUser();
  if (currentUser.userId == null) redirect("/sign-in");

  const ticket = await getTicketWithMessages(ticketId);
  if (ticket == null || !canViewTicket(currentUser, ticket)) {
    return notFound();
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* ---------------- HERO ---------------- */}
      <section className="relative overflow-hidden border-b border-white/10 bg-gradient-to-b from-primary/5 via-background to-background py-14 md:py-20">
        <div className="absolute top-0 left-1/2 -z-10 h-[280px] w-[480px] -translate-x-1/2 rounded-full bg-primary/10 blur-[120px]" />

        <div className="container mx-auto px-4">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl text-balance">
              {ticket.subject}
            </h1>
            <Badge
              variant={ticket.status === "open" ? "default" : "secondary"}
              className="rounded-[4px]"
            >
              {ticket.status.replace("_", " ")}
            </Badge>
          </div>
        </div>
      </section>

      {/* ---------------- CONTENT ---------------- */}
      <section className="container mx-auto px-4 py-10">
        <div className="mx-auto max-w-2xl">
          <Card className="border-white/30 bg-white/60 shadow-sm backdrop-blur-2xl backdrop-saturate-150 dark:border-white/10 dark:bg-black/40">
            <CardContent className="p-6">
              <SupportTicketThread
                ticketId={ticket.id}
                messages={ticket.messages}
                isClosed={ticket.status === "closed"}
              />
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
