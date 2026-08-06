import { NextResponse, type NextRequest } from "next/server"
import { getSessionCookie } from "better-auth/cookies"

const protectedPrefixes = ["/account", "/certificates", "/purchases", "/teach", "/admin"]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isProtectedRoute = protectedPrefixes.some(prefix => pathname.startsWith(prefix))

  if (!isProtectedRoute) {
    return NextResponse.next()
  }

  // Cookie-presence check only — cheap, edge-safe, no DB call. This blocks
  // obviously-unauthenticated requests early; it does NOT replace real
  // permission checks (role, ownership) which still belong in each
  // page/action's own auth logic. This is a fast first gate, not the
  // source of truth.
  const sessionCookie = getSessionCookie(request)
  if (sessionCookie == null) {
    const signInUrl = new URL("/sign-in", request.url)
    signInUrl.searchParams.set("redirectTo", pathname)
    return NextResponse.redirect(signInUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
}
