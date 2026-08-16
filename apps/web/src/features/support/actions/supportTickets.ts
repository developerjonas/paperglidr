// Destination: apps/web/src/features/support/actions/supportTickets.ts

"use server";

import { z } from "zod";
import { getCurrentUser } from "@/services/auth";
import { SupportTicketStatus, supportTicketStatuses } from "@/drizzle/schema";
import { newTicketSchema, replySchema } from "../schemas/supportTickets";
import {
  canCreateSupportTicket,
  canReplyToTicket,
  canManageTicketStatus,
} from "../permissions/supportTickets";
import {
  createTicket,
  addMessage,
  setTicketStatus,
  getTicketWithMessages,
} from "../db/supportTickets";

export async function createSupportTicket(
  unsafeData: z.infer<typeof newTicketSchema>,
) {
  const { success, data } = newTicketSchema.safeParse(unsafeData);
  const currentUser = await getCurrentUser();

  if (!success || !canCreateSupportTicket(currentUser)) {
    return { error: true, message: "You need to sign in to contact support" };
  }

  const ticket = await createTicket({ userId: currentUser.userId, ...data });
  return { error: false, message: "Ticket submitted", ticketId: ticket.id };
}

export async function replyToSupportTicket(
  ticketId: string,
  unsafeData: z.infer<typeof replySchema>,
) {
  const { success, data } = replySchema.safeParse(unsafeData);
  const currentUser = await getCurrentUser();
  if (!success) return { error: true, message: "Message can't be empty" };

  const ticket = await getTicketWithMessages(ticketId);
  if (ticket == null || !canReplyToTicket(currentUser, ticket)) {
    return { error: true, message: "Not authorized to reply" };
  }

  const isAdminReply = currentUser.role === "admin";
  await addMessage({
    ticketId,
    authorId: currentUser.userId!,
    isAdminReply,
    content: data.content,
    ticketUserId: ticket.userId,
  });

  // Notify the other party. Reuse your existing Resend service — mirrors
  // the pattern in lessonQuestions/lib/sendReplyNotification.ts. Wire in
  // the actual call once you confirm that helper's signature.
  // await sendSupportTicketNotification({ ticket, isAdminReply });

  return { error: false, message: "Reply sent" };
}

export async function updateSupportTicketStatus(
  ticketId: string,
  status: SupportTicketStatus,
) {
  const currentUser = await getCurrentUser();
  if (
    !canManageTicketStatus(currentUser) ||
    !supportTicketStatuses.includes(status)
  ) {
    return { error: true, message: "Not authorized" };
  }

  const ticket = await getTicketWithMessages(ticketId);
  if (ticket == null) return { error: true, message: "Ticket not found" };

  await setTicketStatus(ticketId, ticket.userId, status);
  return { error: false, message: "Status updated" };
}
