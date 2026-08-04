import Link from "next/link"
import { Suspense } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { canAccessAdminPages } from "@/permissions/general"
import { getCurrentUser } from "@/services/clerk" // Swap with your Better Auth session call if needed
import { Shield, User, GraduationCap, Presentation } from "lucide-react"

type NavbarProps = {
  isAdminPage?: boolean
}

export function Navbar({ isAdminPage = false }: NavbarProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between px-4 sm:px-8">
        <Link href="/" className="flex items-center gap-2 text-xl font-extrabold tracking-tight">
          PAPER<span className="text-primary">GLIDR</span>
          {isAdminPage && (
            <Badge variant="secondary" className="ml-1 border border-amber-500/30 bg-amber-500/10 text-amber-600 text-xs">
              STUDIO
            </Badge>
          )}
        </Link>

        <Suspense fallback={<div className="h-9 w-40 animate-pulse rounded-lg bg-muted/60" />}>
          <NavLinks isAdminPage={isAdminPage} />
        </Suspense>
      </div>
    </header>
  )
}

async function NavLinks({ isAdminPage }: { isAdminPage: boolean }) {
  const user = await getCurrentUser()

  // Guest state — Udemy-style: browse, become a tutor, sign in
  if (!user || !user.userId) {
    return (
      <div className="flex items-center gap-2 sm:gap-4">
        <Link href="/teach" className="hidden sm:block text-sm font-medium text-muted-foreground hover:text-foreground">
          Become a Tutor
        </Link>
        <Button asChild variant="ghost" size="sm">
          <Link href="/sign-in">Sign In</Link>
        </Button>
        <Button asChild size="sm">
          <Link href="/sign-up">Get Started</Link>
        </Button>
      </div>
    )
  }

  const isAdmin = canAccessAdminPages(user)

  // Admin/Studio mode — kept minimal, exit link only (assume a sidebar handles admin nav)
  if (isAdminPage) {
    return (
      <Link href="/" className="text-sm font-medium text-muted-foreground hover:text-foreground">
        Exit Studio
      </Link>
    )
  }

  // Logged-in consumer mode
  return (
    <div className="flex items-center gap-1 sm:gap-3">
      {isAdmin ? (
        <Link
          href="/admin"
          className="flex items-center gap-1.5 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-600 hover:bg-amber-500/20"
        >
          <Shield className="h-3.5 w-3.5" />
          Creator Studio
        </Link>
      ) : (
        <Link
          href="/teach"
          className="hidden sm:flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <Presentation className="h-4 w-4" />
          Become a Tutor
        </Link>
      )}

      <Link
        href="/courses"
        className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <GraduationCap className="h-4 w-4" />
        My Courses
      </Link>

      <Button asChild variant="outline" size="sm" className="ml-1 gap-2 rounded-full">
        <Link href="/account">
          <User className="h-4 w-4" />
          Profile
        </Link>
      </Button>
    </div>
  )
}
