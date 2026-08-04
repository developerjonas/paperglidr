import Link from "next/link"
import { Suspense } from "react"
import { Button } from "@/components/ui/button"
import { canAccessAdminPages } from "@/permissions/general"
import { getCurrentUser } from "@/services/clerk" // Replace path with your auth service

type NavbarProps = {
  isAdminPage?: boolean
}

export function Navbar({ isAdminPage = false }: NavbarProps) {
  return (
    <header className="sticky top-0 z-10 flex h-14 border-b bg-background shadow-sm">
      <nav className="container flex items-center gap-4">
        {/* Brand Logo */}
        <Link
          className="mr-auto flex items-center text-xl font-bold tracking-tight text-primary transition-opacity hover:opacity-90"
          href="/"
        >
          paperglidr
        </Link>

        {/* Dynamic Navigation Content */}
        <Suspense fallback={<div className="h-8 w-48 animate-pulse rounded bg-muted" />}>
          <NavLinks isAdminPage={isAdminPage} />
        </Suspense>
      </nav>
    </header>
  )
}

async function NavLinks({ isAdminPage }: { isAdminPage: boolean }) {
  const user = await getCurrentUser()

  // Guest State
  if (!user || !user.userId) {
    return (
      <Button asChild size="sm">
        <Link href="/sign-in">Sign In</Link>
      </Button>
    )
  }

  const isAdmin = canAccessAdminPages(user)

  return (
    <div className="flex items-center gap-2">
      {/* Admin Mode Nav Links */}
      {isAdminPage ? (
        <>
          <NavLink href="/admin/courses">Courses</NavLink>
          <NavLink href="/admin/products">Products</NavLink>
          <NavLink href="/admin/sales">Sales</NavLink>
          <NavLink href="/" className="text-muted-foreground hover:text-foreground">
            Exit Admin
          </NavLink>
        </>
      ) : (
        /* Consumer Mode Nav Links */
        <>
          {isAdmin && (
            <NavLink href="/admin" className="text-amber-600 dark:text-amber-400">
              Admin
            </NavLink>
          )}
          <NavLink href="/courses">My Courses</NavLink>
          <NavLink href="/purchases">Purchase History</NavLink>
        </>
      )}

      {/* User Avatar / Profile Button */}
      <Button variant="outline" size="sm" asChild className="ml-2">
        <Link href="/account">Profile</Link>
      </Button>
    </div>
  )
}

function NavLink({
  href,
  children,
  className = "",
}: {
  href: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <Link
      href={href}
      className={`flex items-center rounded-md px-3 py-1.5 text-sm font-medium transition-colors hover:bg-accent/10 ${className}`}
    >
      {children}
    </Link>
  )
}
