import { NextResponse } from "next/server"

// Browser error reports, relayed to GlitchTip through our own domain so
// ad blockers that block the error service's domain don't drop them
// (instrumentation-client.ts sets `tunnel: "/api/monitoring"`).
//
// Only envelopes for *our* project are forwarded: the envelope's DSN must
// match NEXT_PUBLIC_SENTRY_DSN, so this can't be used to send data to any
// other project or host.

const MAX_BYTES = 1_000_000

function configuredDsn() {
  const value = process.env.NEXT_PUBLIC_SENTRY_DSN ?? process.env.SENTRY_DSN
  if (!value) return null
  try {
    return new URL(value)
  } catch {
    return null
  }
}

const reply = (status: number) => new NextResponse(null, { status, headers: { "Cache-Control": "no-store" } })

export async function POST(request: Request) {
  const dsn = configuredDsn()
  if (dsn == null) return reply(404)

  const envelope = await request.text()
  if (envelope.length === 0 || envelope.length > MAX_BYTES) return reply(400)

  // An envelope starts with a one-line JSON header carrying the DSN.
  let header: { dsn?: string }
  try {
    header = JSON.parse(envelope.slice(0, envelope.indexOf("\n") === -1 ? undefined : envelope.indexOf("\n")))
  } catch {
    return reply(400)
  }
  let target: URL
  try {
    target = new URL(header.dsn ?? "")
  } catch {
    return reply(400)
  }
  const projectId = dsn.pathname.replace(/^\//, "")
  if (target.host !== dsn.host || target.pathname !== dsn.pathname || target.username !== dsn.username) {
    return reply(403)
  }

  try {
    const upstream = await fetch(
      `${dsn.protocol}//${dsn.host}/api/${encodeURIComponent(projectId)}/envelope/?sentry_key=${encodeURIComponent(dsn.username)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-sentry-envelope" },
        body: envelope,
        signal: AbortSignal.timeout(10_000),
      },
    )
    return reply(upstream.ok ? 200 : upstream.status)
  } catch {
    return reply(502)
  }
}
