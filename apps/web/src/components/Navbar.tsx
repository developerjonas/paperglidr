import Link from "next/link";
import { Suspense } from "react";
import { eq } from "drizzle-orm";
import { SearchIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Logo } from "@/components/Logo";
import { ThemeSwitch } from "@/components/ThemeToggle";
import { AccountMenu, DesktopLinks, MobileNav } from "@/components/nav/NavMenu";
import type { NavContext } from "@/components/nav/navItems";
import { SearchBar } from "@/features/search/components/SearchBar";
import { canAccessAdminPages } from "@/permissions/general";
import { getCurrentUser } from "@/services/auth";
import { db } from "@/drizzle/db";
import { InstructorTable } from "@/drizzle/schema";

type NavbarProps = {
  isAdminPage?: boolean;
};

export function Navbar({ isAdminPage = false }: NavbarProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <Logo>
          {isAdminPage && (
            <Badge
              variant="secondary"
              className="ml-1 rounded-full border border-amber-500/30 bg-amber-500/10 text-[10px] font-semibold not-italic tracking-wider text-amber-600 dark:text-amber-400"
            >
              STUDIO
            </Badge>
          )}
        </Logo>

        <Suspense
          fallback={
            <div className="flex items-center gap-2">
              <div className="h-9 w-[4.5rem] animate-pulse rounded-full bg-secondary" />
              <div className="h-9 w-9 animate-pulse rounded-full bg-secondary" />
            </div>
          }
        >
          <NavActions isAdminPage={isAdminPage} />
        </Suspense>
      </div>
    </header>
  );
}

async function getNavContext(): Promise<NavContext> {
  const user = await getCurrentUser({ allData: true });
  const isLoggedIn = Boolean(user?.userId);
  const isAdmin = isLoggedIn ? canAccessAdminPages(user) : false;

  let isInstructor = false;
  if (isLoggedIn && user?.userId) {
    const instructor = await db.query.InstructorTable.findFirst({
      where: eq(InstructorTable.userId, user.userId),
      columns: { id: true },
    });
    isInstructor = instructor != null;
  }

  const name = user?.user?.name ?? null;
  const initials =
    name
      ?.split(" ")
      .map((part: string) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || null;

  return {
    isLoggedIn,
    isAdmin,
    isInstructor,
    name,
    email: user?.user?.email ?? null,
    image: user?.user?.image ?? null,
    initials,
  };
}

async function NavActions({ isAdminPage }: { isAdminPage: boolean }) {
  if (isAdminPage) {
    return (
      <div className="flex items-center gap-2">
        <ThemeSwitch />
        <Link
          href="/"
          className="rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          Exit Studio
        </Link>
      </div>
    );
  }

  const ctx = await getNavContext();

  return (
    <div className="flex items-center gap-1 sm:gap-2">
      <DesktopLinks ctx={ctx} />

      <div className="hidden w-56 lg:block xl:w-64">
        <Suspense fallback={<div className="h-10 rounded-full bg-secondary" />}>
          <SearchBar />
        </Suspense>
      </div>

      <ThemeSwitch className="ml-1 hidden sm:flex" />

      <AccountMenu ctx={ctx} />

      {/* Tablet: no inline search bar between md and lg — link to the catalogue search. */}
      <Link
        href="/browse"
        aria-label="Search courses"
        className="flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground lg:hidden"
      >
        <SearchIcon className="h-5 w-5" />
      </Link>

      <MobileNav ctx={ctx} />
    </div>
  );
}
