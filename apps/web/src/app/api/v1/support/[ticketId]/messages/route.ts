import { NextResponse } from "next/server"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { getTicketForUser, apiAddMessage } from "@/features/support/db/supportTickets"

export async function POST(
  req: Request,
  { params }: { params: Promise<{ ticketId: string }> },
) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  const { ticketId } = await params

  // Confirms ownership before allowing a reply — a user can't post into
  // someone else's ticket by guessing an id.
  const ticket = await getTicketForUser({ ticketId, userId: session.user.id })
  if (!ticket) {
    return NextResponse.json({ message: "Ticket not found" }, { status: 404 })
  }

  const { content } = await req.json()
  if (!content?.trim()) {
    return NextResponse.json({ message: "content is required" }, { status: 400 })
  }

  const message = await apiAddMessage({
    ticketId,
    authorId: session.user.id,
    content: content.trim(),
    isAdminReply: false,
  })

  return NextResponse.json(message, { status: 201 })
}
