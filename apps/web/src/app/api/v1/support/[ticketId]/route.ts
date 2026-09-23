// apps/web/src/app/api/v1/support/[ticketId]/route.ts
import { NextResponse } from "next/server"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { getTicketForUser } from "@/features/support/db/supportTickets"
import { mobileApiDisabled } from "@/lib/mobileApi"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ ticketId: string }> },
) {
  const disabled = mobileApiDisabled()
  if (disabled) return disabled

  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  const { ticketId } = await params
  const ticket = await getTicketForUser({ ticketId, userId: session.user.id })
  if (!ticket) {
    return NextResponse.json({ message: "Ticket not found" }, { status: 404 })
  }

  return NextResponse.json(ticket)
}
