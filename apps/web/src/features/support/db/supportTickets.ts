// Destination: apps/web/src/features/support/db/supportTickets.ts

import { db } from "@/drizzle/db";
import {
  SupportTicketTable,
  SupportTicketMessageTable,
  SupportTicketCategory,
  SupportTicketStatus,
} from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { cacheTag } from "next/dist/server/use-cache/cache-tag";
import {
  revalidateSupportTicketCache,
  getSupportTicketGlobalTag,
  getSupportTicketUserTag,
  getSupportTicketIdTag,
} from "./cache";

export async function createTicket({
  userId,
  subject,
  category,
  message,
}: {
  userId: string;
  subject: string;
  category: SupportTicketCategory;
  message: string;
}) {
  const [ticket] = await db
    .insert(SupportTicketTable)
    .values({ userId, subject, category })
    .returning();
  if (ticket == null) throw new Error("Failed to create support ticket");

  await db.insert(SupportTicketMessageTable).values({
    ticketId: ticket.id,
    authorId: userId,
    isAdminReply: false,
    content: message,
  });

  revalidateSupportTicketCache({ id: ticket.id, userId });
  return ticket;
}

export async function addMessage({
  ticketId,
  authorId,
  isAdminReply,
  content,
  ticketUserId,
}: {
  ticketId: string;
  authorId: string;
  isAdminReply: boolean;
  content: string;
  // Owner of the ticket — needed to revalidate their user-scoped cache
  // tag even when an admin is the one posting the reply.
  ticketUserId: string;
}) {
  const [msg] = await db
    .insert(SupportTicketMessageTable)
    .values({ ticketId, authorId, isAdminReply, content })
    .returning();
  if (msg == null) throw new Error("Failed to add message");

  // An admin reply moves an open ticket into progress; a user reply to
  // a resolved ticket reopens it. Closed tickets stay closed — reopen
  // explicitly via setTicketStatus instead.
  const [ticket] = await db
    .select({ status: SupportTicketTable.status })
    .from(SupportTicketTable)
    .where(eq(SupportTicketTable.id, ticketId));

  let nextStatus: SupportTicketStatus | undefined;
  if (isAdminReply && ticket?.status === "open") {
    nextStatus = "in_progress";
  } else if (!isAdminReply && ticket?.status === "resolved") {
    nextStatus = "open";
  }

  await db
    .update(SupportTicketTable)
    .set({
      lastMessageAt: new Date(),
      ...(nextStatus ? { status: nextStatus } : {}),
    })
    .where(eq(SupportTicketTable.id, ticketId));

  revalidateSupportTicketCache({ id: ticketId, userId: ticketUserId });
  return msg;
}

export async function setTicketStatus(
  id: string,
  userId: string,
  status: SupportTicketStatus,
) {
  const [updated] = await db
    .update(SupportTicketTable)
    .set({ status })
    .where(eq(SupportTicketTable.id, id))
    .returning();
  if (updated == null) throw new Error("Failed to update ticket status");
  revalidateSupportTicketCache({ id, userId });
  return updated;
}

export async function getTicketsForUser(userId: string) {
  "use cache";
  cacheTag(getSupportTicketUserTag(userId));
  return db.query.SupportTicketTable.findMany({
    where: (tickets, { eq }) => eq(tickets.userId, userId),
    orderBy: (tickets, { desc }) => desc(tickets.lastMessageAt),
  });
}

export async function getAllTickets(status?: SupportTicketStatus) {
  "use cache";
  cacheTag(getSupportTicketGlobalTag());
  return db.query.SupportTicketTable.findMany({
    where: (tickets, { eq }) =>
      status ? eq(tickets.status, status) : undefined,
    orderBy: (tickets, { desc }) => desc(tickets.lastMessageAt),
    with: { user: { columns: { name: true, email: true } } },
  });
}

export async function getTicketWithMessages(id: string) {
  "use cache";
  cacheTag(getSupportTicketIdTag(id));
  return db.query.SupportTicketTable.findFirst({
    where: (tickets, { eq }) => eq(tickets.id, id),
    with: {
      user: { columns: { id: true, name: true, email: true } },
      messages: {
        orderBy: (messages, { asc }) => asc(messages.createdAt),
        with: { author: { columns: { name: true, image: true } } },
      },
    },
  });
}
