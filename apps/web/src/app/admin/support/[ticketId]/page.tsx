// Destination: apps/web/src/app/admin/support/[ticketId]/page.tsx

import { notFound } from "next/navigation";
import { getTicketWithMessages } from "@/features/support/db/supportTickets";
import { SupportTicketThread } from "@/features/support/components/SupportTicketThread";
import { AdminTicketStatusSelect } from "@/features/support/components/AdminTicketStatusSelect";
import { PageHeader } from "@/components/PageHeader";

export default async function AdminSupportTicketPage({
  params,
}: {
  params: Promise<{ ticketId: string }>;
}) {
  const { ticketId } = await params;
  const ticket = await getTicketWithMessages(ticketId);
  if (ticket == null) return notFound();

  return (
    <div className="container my-6 max-w-2xl space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <PageHeader title={ticket.subject} />
          <p className="text-sm text-muted-foreground">
            {ticket.user?.name ?? ticket.user?.email} · {ticket.category}
          </p>
        </div>
        <AdminTicketStatusSelect ticketId={ticket.id} status={ticket.status} />
      </div>
      <SupportTicketThread
        ticketId={ticket.id}
        messages={ticket.messages}
        isClosed={ticket.status === "closed"}
        isAdminView
      />
    </div>
  );
}
