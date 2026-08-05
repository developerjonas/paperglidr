import Link from "next/link"
import { Suspense } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { canAccessAdminPages } from "@/permissions/general"
import { getCurrentUser } from "@/services/clerk" // Swap with your Better Auth session call if needed
import { ThemeToggle } from "@/components/theme-toggle"
import { Shield, User, GraduationCap, Presentation } from "lucide-react"

type NavbarProps = {
  isAdminPage?: boolean
}

export function Navbar({ isAdminPage = false }: NavbarProps) {
  return (
    <header
      className="sticky top-0 z-50 w-full border-b border-white/20 bg-white/60 shadow-[0_1px_0_0_rgba(255,255,255,0.5)_inset,0_8px_30px_-12px_rgba(0,0,0,0.1)] backdrop-blur-2xl backdrop-saturate-150
      dark:border-white/10 dark:bg-black/40 dark:shadow-[0_1px_0_0_rgba(255,255,255,0.06)_inset,0_8px_30px_-12px_rgba(0,0,0,0.5)]"
    >
      <div className="container flex h-16 items-center justify-between px-4 sm:px-8">
        <Link href="/" className="flex items-center gap-2 text-xl font-extrabold tracking-tight">
          PAPERGLIDR
          {isAdminPage && (
            <Badge
              variant="secondary"
              className="ml-1 border border-amber-500/30 bg-amber-500/10 text-amber-600 text-xs backdrop-blur-sm"
            >
              STUDIO
            </Badge>
          )}
        </Link>
        <Suspense
          fallback={
            <div className="flex items-center gap-3">
              <div className="h-9 w-40 animate-pulse rounded-full bg-white/40 backdrop-blur-md dark:bg-white/5" />
              <div className="h-9 w-[60px] animate-pulse rounded-full bg-white/40 backdrop-blur-md dark:bg-white/5" />
            </div>
          }
        >
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
        <Link
          href="/teach"
          className="hidden rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-white/50 hover:text-foreground sm:block dark:hover:bg-white/10"
        >
          Teach
        </Link>
        <ThemeToggle />
        <Button
          asChild
          size="sm"
          className="rounded-full shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)]"
        >
          <Link href="/sign-up">Get Started</Link>
        </Button>
      </div>
    )
  }

  const isAdmin = canAccessAdminPages(user)

  // Admin/Studio mode — kept minimal, exit link only (assume a sidebar handles admin nav)
  if (isAdminPage) {
    return (
      <div className="flex items-center gap-3">
        <ThemeToggle />
        <Link
          href="/"
          className="rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-white/50 hover:text-foreground dark:hover:bg-white/10"
        >
          Exit Studio
        </Link>
      </div>
    )
  }

  // Logged-in consumer mode
  return (
    <div className="flex items-center gap-1 sm:gap-3">
      {isAdmin ? (
        <Link
          href="/admin"
          className="flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-600 backdrop-blur-md transition-colors hover:bg-amber-500/20"
        >
          <Shield className="h-3.5 w-3.5" />
          Creator Studio
        </Link>
      ) : (
        <Link
          href="/teach"
          className="hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-white/50 hover:text-foreground sm:flex dark:hover:bg-white/10"
        >
          <Presentation className="h-4 w-4" />
          Teach
        </Link>
      )}
      <Link
        href="/courses"
        className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-white/50 hover:text-foreground dark:hover:bg-white/10"
      >
        <GraduationCap className="h-4 w-4" />
        My Courses
      </Link>
      <ThemeToggle />
      <Button
        asChild
        variant="outline"
        size="sm"
        className="ml-1 gap-2 rounded-full border-white/30 bg-white/40 backdrop-blur-md hover:bg-white/55 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
      >
        <Link href="/account">
          <User className="h-4 w-4" />
          Profile
        </Link>
      </Button>
    </div>
  )
}
