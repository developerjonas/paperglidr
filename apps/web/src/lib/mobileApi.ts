import "server-only"
import { NextResponse } from "next/server"
import { env } from "@/data/env/server"

/**
 * First line of every user-specific /api/v1 handler. The mobile app isn't
 * launching, so these routes 404 (as if they didn't exist) unless
 * MOBILE_API_ENABLED=true. Public catalogue routes don't use this.
 */
export function mobileApiDisabled() {
  if (env.MOBILE_API_ENABLED) return null
  return NextResponse.json({ message: "Not found" }, { status: 404 })
}
