// apps/web/src/app/api/v1/support/[ticketId]/route.ts
import { apiError, apiJson, isUuid, requireApiUser, v1Route } from "@/lib/api/v1"
import { getTicketForUser } from "@/features/support/db/supportTickets"

/** One of the user's tickets with every message, oldest first. */
export const GET = v1Route<{ ticketId: string }>("support ticket", async (_req, { params }) => {
  const gate = await requireApiUser()
  if (!gate.ok) return gate.response
  const { ticketId } = await params
  if (!isUuid(ticketId)) return apiError(404, "Ticket not found")

  const ticket = await getTicketForUser({ ticketId, userId: gate.user.userId })
  if (!ticket) return apiError(404, "Ticket not found")
  return apiJson(ticket)
})
