// Destination: apps/web/src/app/(consumer)/support/[ticketId]/page.tsx

import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/services/auth";
import { getTicketWithMessages } from "@/features/support/db/supportTickets";
import { canViewTicket } from "@/features/support/permissions/supportTickets";
import { SupportTicketThread } from "@/features/support/components/SupportTicketThread";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/ui/badge";

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
    <div className="container my-6 max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <PageHeader title={ticket.subject} />
        <Badge variant={ticket.status === "open" ? "default" : "secondary"}>
          {ticket.status.replace("_", " ")}
        </Badge>
      </div>
      <SupportTicketThread
        ticketId={ticket.id}
        messages={ticket.messages}
        isClosed={ticket.status === "closed"}
      />
    </div>
  );
}
