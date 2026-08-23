// apps/web/src/app/api/v1/support/route.ts
import { NextResponse } from "next/server"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { getTicketsForUser, createTicket } from "@/features/support/db/supportTickets"
import { supportTicketCategories } from "@/drizzle/schema"

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }
  const tickets = await getTicketsForUser(session.user.id)
  return NextResponse.json(tickets)
}

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const { subject, category, message } = body

  if (!subject?.trim() || !message?.trim()) {
    return NextResponse.json({ message: "subject and message are required" }, { status: 400 })
  }
  if (category && !supportTicketCategories.includes(category)) {
    return NextResponse.json({ message: "Invalid category" }, { status: 400 })
  }

  const ticket = await createTicket({
    userId: session.user.id,
    subject: subject.trim(),
    category: category ?? "other",
    message: message.trim(),
  })

  return NextResponse.json(ticket, { status: 201 })
}
