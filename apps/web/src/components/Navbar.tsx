import Link from "next/link"
import { Suspense } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { canAccessAdminPages } from "@/permissions/general"
import { getCurrentUser } from "@/services/clerk" // Swap with your Better Auth / auth session call if needed
import {
  BookOpen,
  ShoppingBag,
  Receipt,
  Shield,
  LogOut,
  User,
  ArrowRight,
  Sparkles,
  GraduationCap,
} from "lucide-react"

type NavbarProps = {
  isAdminPage?: boolean
}

export function Navbar({ isAdminPage = false }: NavbarProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md transition-all">
      <div className="container flex h-16 items-center justify-between px-4 sm:px-8">
        {/* Brand Logo */}
        <Link
          className="group flex items-center gap-2 text-xl font-black tracking-wider transition-opacity hover:opacity-95"
          href="/"
        >
          {/* Logo Mark */}
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-primary to-primary/70 text-primary-foreground shadow-md shadow-primary/20 transition-transform group-hover:scale-105">
            <Sparkles className="h-5 w-5" />
          </div>

          {/* Styled Logo Text */}
          <div className="flex items-center text-xl font-extrabold tracking-tight">
            <span className="text-foreground">PAPER</span>
            <span className="text-primary">GLIDR</span>
          </div>

          {/* Admin Context Badge */}
          {isAdminPage && (
            <Badge
              variant="secondary"
              className="ml-2 border border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-semibold"
            >
              STUDIO
            </Badge>
          )}
        </Link>

        {/* Dynamic Navigation Content */}
        <Suspense
          fallback={
            <div className="flex items-center gap-3">
              <div className="h-8 w-24 animate-pulse rounded-lg bg-muted/60" />
              <div className="h-8 w-24 animate-pulse rounded-lg bg-muted/60" />
              <div className="h-9 w-9 animate-pulse rounded-full bg-muted/60" />
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

  // Guest State
  if (!user || !user.userId) {
    return (
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm" className="font-medium">
          <Link href="/sign-in">Sign In</Link>
        </Button>
        <Button
          asChild
          size="sm"
          className="shadow-sm shadow-primary/20 transition-all hover:shadow-md hover:shadow-primary/30"
        >
          <Link href="/sign-up" className="flex items-center gap-1.5">
            Get Started
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    )
  }

  const isAdmin = canAccessAdminPages(user)

  return (
    <div className="flex items-center gap-1 sm:gap-2">
      {/* Admin Mode Nav Links */}
      {isAdminPage ? (
        <nav className="flex items-center gap-1 rounded-full border border-border/50 bg-muted/40 p-1">
          <NavLink href="/admin/courses" icon={BookOpen}>
            Courses
          </NavLink>
          <NavLink href="/admin/products" icon={ShoppingBag}>
            Products
          </NavLink>
          <NavLink href="/admin/sales" icon={Receipt}>
            Sales
          </NavLink>
          <Link
            href="/"
            className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-muted-foreground transition-all hover:bg-background hover:text-foreground hover:shadow-sm"
          >
            <LogOut className="h-3.5 w-3.5" />
            Exit Admin
          </Link>
        </nav>
      ) : (
        /* Consumer Mode Nav Links */
        <nav className="flex items-center gap-1">
          {isAdmin && (
            <Link
              href="/admin"
              className="mr-2 flex items-center gap-1.5 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-600 transition-colors hover:bg-amber-500/20 dark:text-amber-400"
            >
              <Shield className="h-3.5 w-3.5" />
              Creator Studio
            </Link>
          )}
          <NavLink href="/courses" icon={GraduationCap}>
            My Courses
          </NavLink>
          <NavLink href="/purchases" icon={Receipt}>
            History
          </NavLink>
        </nav>
      )}

      {/* User Avatar / Profile Button */}
      <Button
        variant="outline"
        size="sm"
        asChild
        className="ml-2 gap-2 rounded-full border-border/60 font-medium shadow-none hover:bg-accent"
      >
        <Link href="/account">
          <User className="h-4 w-4 text-muted-foreground" />
          <span>Profile</span>
        </Link>
      </Button>
    </div>
  )
}

function NavLink({
  href,
  children,
  icon: Icon,
  className = "",
}: {
  href: string
  children: React.ReactNode
  icon?: React.ComponentType<{ className?: string }>
  className?: string
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-all hover:bg-accent hover:text-foreground ${className}`}
    >
      {Icon && <Icon className="h-4 w-4 text-muted-foreground/80" />}
      {children}
    </Link>
  )
}
