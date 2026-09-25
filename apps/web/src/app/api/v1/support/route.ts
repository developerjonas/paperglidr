// apps/web/src/app/api/v1/support/route.ts
import { apiError, apiJson, readJson, requireApiUser, v1Route } from "@/lib/api/v1"
import { getTicketForUser, getTicketsForUser } from "@/features/support/db/supportTickets"
import { createSupportTicket } from "@/features/support/actions/supportTickets"
import { newTicketSchema } from "@/features/support/schemas/supportTickets"

/** The user's support tickets, most recently active first. */
export const GET = v1Route("support tickets", async () => {
  const gate = await requireApiUser()
  if (!gate.ok) return gate.response
  return apiJson(await getTicketsForUser(gate.user.userId))
})

// category is optional here ("other" by default); the rest as on the web form.
const ticketSchema = newTicketSchema.extend({
  category: newTicketSchema.shape.category.default("other"),
})

/**
 * Open a ticket. Body: { subject (3-150), message (10-5000), category? }.
 * Returns the ticket with its first message.
 */
export const POST = v1Route("create support ticket", async req => {
  const gate = await requireApiUser()
  if (!gate.ok) return gate.response

  const input = await readJson(req, ticketSchema)
  if (!input.ok) return input.response

  const result = await createSupportTicket(input.data)
  if (result.error || result.ticketId == null) {
    return apiError(400, result.message ?? "Couldn't open the ticket")
  }
  return apiJson(await getTicketForUser({ ticketId: result.ticketId, userId: gate.user.userId }), 201)
})
