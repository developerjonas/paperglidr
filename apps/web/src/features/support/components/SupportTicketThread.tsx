// Destination: apps/web/src/features/support/components/SupportTicketThread.tsx
// Renders the message list + a reply box. Used on both the student-facing
// /support/[ticketId] page and the admin /admin/support/[ticketId] page —
// pass isAdminView to swap the "you"/"support team" labeling.

"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { replyToSupportTicket } from "../actions/supportTickets";

type Message = {
  id: string;
  content: string;
  isAdminReply: boolean;
  createdAt: Date;
  author: { name: string | null; image: string | null } | null;
};

export function SupportTicketThread({
  ticketId,
  messages,
  isClosed,
  isAdminView = false,
}: {
  ticketId: string;
  messages: Message[];
  isClosed: boolean;
  isAdminView?: boolean;
}) {
  const [content, setContent] = useState("");
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;

    startTransition(async () => {
      const result = await replyToSupportTicket(ticketId, { content });
      if (result.error) {
        toast({ variant: "destructive", description: result.message });
        return;
      }
      setContent("");
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "rounded-lg border p-3",
              msg.isAdminReply ? "border-primary/20 bg-primary/5 ml-6" : "mr-6",
            )}
          >
            <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">
                {msg.isAdminReply
                  ? "Support Team"
                  : (msg.author?.name ?? "User")}
              </span>
              {msg.isAdminReply && <Badge variant="secondary">Staff</Badge>}
              <span>{formatDate(msg.createdAt)}</span>
            </div>
            <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
          </div>
        ))}
      </div>

      {isClosed ? (
        <p className="text-sm text-muted-foreground">
          This ticket is closed.
          {!isAdminView && " Submit a new ticket if you still need help."}
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
            placeholder={
              isAdminView ? "Reply to the user..." : "Add a reply..."
            }
          />
          <Button
            type="submit"
            disabled={isPending || !content.trim()}
            className="self-end"
          >
            {isPending ? "Sending..." : "Send"}
          </Button>
        </form>
      )}
    </div>
  );
}
