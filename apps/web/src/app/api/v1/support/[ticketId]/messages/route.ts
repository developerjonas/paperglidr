import { apiError, apiJson, isUuid, readJson, requireApiUser, v1Route } from "@/lib/api/v1"
import { getTicketForUser } from "@/features/support/db/supportTickets"
import { replyToSupportTicket } from "@/features/support/actions/supportTickets"
import { replySchema } from "@/features/support/schemas/supportTickets"

/** Reply on one of your tickets. Body: { content } (1-5000). Returns the updated ticket. */
export const POST = v1Route<{ ticketId: string }>("reply to support ticket", async (req, { params }) => {
  const gate = await requireApiUser()
  if (!gate.ok) return gate.response
  const { ticketId } = await params
  if (!isUuid(ticketId)) return apiError(404, "Ticket not found")

  // Ownership first: someone else's ticket id is a 404, not a 403.
  if ((await getTicketForUser({ ticketId, userId: gate.user.userId })) == null) {
    return apiError(404, "Ticket not found")
  }

  const input = await readJson(req, replySchema)
  if (!input.ok) return input.response

  const result = await replyToSupportTicket(ticketId, input.data)
  if (result.error) return apiError(403, result.message)
  return apiJson(await getTicketForUser({ ticketId, userId: gate.user.userId }), 201)
})
