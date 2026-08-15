// Destination: apps/web/src/features/support/components/AdminTicketStatusSelect.tsx

"use client";

import { useTransition } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { updateSupportTicketStatus } from "../actions/supportTickets";
import { SupportTicketStatus, supportTicketStatuses } from "@/drizzle/schema";

const statusLabels: Record<SupportTicketStatus, string> = {
  open: "Open",
  in_progress: "In Progress",
  resolved: "Resolved",
  closed: "Closed",
};

export function AdminTicketStatusSelect({
  ticketId,
  status,
}: {
  ticketId: string;
  status: SupportTicketStatus;
}) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  function handleChange(next: string) {
    startTransition(async () => {
      const result = await updateSupportTicketStatus(
        ticketId,
        next as SupportTicketStatus,
      );
      if (result.error) {
        toast({ variant: "destructive", description: result.message });
      }
    });
  }

  return (
    <Select value={status} onValueChange={handleChange} disabled={isPending}>
      <SelectTrigger className="w-[160px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {supportTicketStatuses.map((s) => (
          <SelectItem key={s} value={s}>
            {statusLabels[s]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
