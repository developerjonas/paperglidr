// src/middleware.ts
import { NextResponse, type NextRequest } from "next/server"
import { getSessionCookie } from "better-auth/cookies"

const protectedPrefixes = ["/account", "/certificates", "/purchases", "/teach", "/admin"]

const REF_COOKIE = "pg_ref"
const REF_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30 // 30 days

function captureReferral(request: NextRequest, response: NextResponse) {
  const ref = request.nextUrl.searchParams.get("ref")
  if (!ref) return response

  // Last click wins — if someone arrives via instructor A's link, then later
  // via instructor B's link, B gets the attribution on next purchase.
  response.cookies.set(REF_COOKIE, ref, {
    maxAge: REF_COOKIE_MAX_AGE_SECONDS,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  })
  return response
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isProtectedRoute = protectedPrefixes.some(prefix => pathname.startsWith(prefix))

  if (isProtectedRoute) {
    // Cookie-presence check only — cheap, edge-safe, no DB call. This blocks
    // obviously-unauthenticated requests early; it does NOT replace real
    // permission checks (role, ownership) which still belong in each
    // page/action's own auth logic. This is a fast first gate, not the
    // source of truth.
    const sessionCookie = getSessionCookie(request)
    if (sessionCookie == null) {
      const signInUrl = new URL("/sign-in", request.url)
      signInUrl.searchParams.set("redirectTo", pathname)
      return captureReferral(request, NextResponse.redirect(signInUrl))
    }
  }

  return captureReferral(request, NextResponse.next())
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
}
