// src/middleware.ts
import { NextResponse, type NextRequest } from "next/server"
import { REF_COOKIE, REF_COOKIE_MAX_AGE_SECONDS } from "@/lib/referral"

// Everything NOT listed here is reachable signed out — including the
// marketing home (/), /browse, product pages, and the legal pages. Keep it
// that way (the security smoke test checks those routes signed out).
//
// /admin is deliberately absent: redirecting signed-out visitors to
// sign-in would reveal the route exists. requireAdmin() in the admin layout,
// pages and actions returns a 404 for everyone who isn't an admin.
//
// Signed-out visitors to these are sent to /sign-in?redirectTo=<path>, so
// they come back after signing in. Pages still do their own checks.
// - prefixes: the path and everything under it
// - exact: that path only. /courses is the signed-in "My courses" list,
//   while /courses/<id> and its lessons stay public (free previews play
//   signed out).
const protectedPrefixes = ["/account", "/certificates", "/purchases", "/teach", "/support"]
const protectedExactPaths = ["/courses"]

function isProtected(pathname: string) {
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname
  return (
    protectedExactPaths.includes(path) ||
    protectedPrefixes.some(prefix => path === prefix || path.startsWith(`${prefix}/`))
  )
}

// Presence of Better Auth's session cookie — the same names its
// getSessionCookie checks (default "better-auth" prefix; "__Secure-" on
// https). Read directly rather than importing better-auth/cookies, which
// pulls jose's JWE code into the edge bundle and trips Next's Edge Runtime
// warning (CompressionStream). Keep in sync if lib/auth.ts ever sets
// advanced.cookiePrefix.
const SESSION_COOKIE_NAMES = [
  "__Secure-better-auth.session_token",
  "better-auth.session_token",
  "__Secure-better-auth-session_token",
  "better-auth-session_token",
]

function hasSessionCookie(request: NextRequest) {
  return SESSION_COOKIE_NAMES.some(name => Boolean(request.cookies.get(name)?.value))
}


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
  const isProtectedRoute = isProtected(pathname)

  if (isProtectedRoute) {
    // Cookie-presence check only — cheap, edge-safe, no DB call. This blocks
    // obviously-unauthenticated requests early; it does NOT replace real
    // permission checks (role, ownership) which still belong in each
    // page/action's own auth logic. This is a fast first gate, not the
    // source of truth.
    if (!hasSessionCookie(request)) {
      const signInUrl = new URL("/sign-in", request.url)
      signInUrl.searchParams.set("redirectTo", pathname + request.nextUrl.search)
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
