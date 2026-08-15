// Destination: apps/web/src/features/support/permissions/supportTickets.ts

import { UserRole } from "@/drizzle/schema";

type CurrentUser = {
  userId: string | undefined | null;
  role?: UserRole;
};

export function canCreateSupportTicket(
  currentUser: CurrentUser,
): currentUser is { userId: string; role?: UserRole } {
  return currentUser.userId != null;
}

export function canViewTicket(
  currentUser: CurrentUser,
  ticket: { userId: string },
) {
  if (currentUser.userId == null) return false;
  return currentUser.role === "admin" || currentUser.userId === ticket.userId;
}

export function canReplyToTicket(
  currentUser: CurrentUser,
  ticket: { userId: string; status: string },
) {
  if (ticket.status === "closed") return false;
  return canViewTicket(currentUser, ticket);
}

export function canManageTicketStatus(currentUser: CurrentUser) {
  return currentUser.role === "admin";
}
