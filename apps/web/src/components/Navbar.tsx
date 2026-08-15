import Link from "next/link";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { canAccessAdminPages } from "@/permissions/general";
import { getCurrentUser } from "@/services/clerk";
import { ThemeToggle } from "@/components/theme-toggle";
import { SearchBar } from "@/features/products/components/SearchBar";
import {
  Shield,
  User,
  GraduationCap,
  Presentation,
  ChevronDown,
} from "lucide-react";
import Image from "next/image";

type NavbarProps = {
  isAdminPage?: boolean;
};

export function Navbar({ isAdminPage = false }: NavbarProps) {
  return (
    <header
      className="sticky top-0 z-50 w-full border-b border-white/20 bg-white/60 shadow-[0_1px_0_0_rgba(255,255,255,0.5)_inset,0_8px_30px_-12px_rgba(0,0,0,0.1)] backdrop-blur-2xl backdrop-saturate-150
      dark:border-white/10 dark:bg-black/40 dark:shadow-[0_1px_0_0_rgba(255,255,255,0.06)_inset,0_8px_30px_-12px_rgba(0,0,0,0.5)]"
    >
      <div className="container relative flex flex-col gap-3 px-4 py-3 sm:px-8 md:h-16 md:flex-row md:items-center md:justify-between md:gap-4 md:py-0">
        <div className="flex w-full items-center justify-between md:w-auto">
          <Link
            href="/"
            className="flex shrink-0 items-center gap-2 text-xl font-extrabold tracking-tight"
          >
            PAPERGLIDR
            {isAdminPage && (
              <Badge
                variant="secondary"
                className="ml-1 rounded-[5px] border border-amber-500/30 bg-amber-500/10 text-amber-600 text-xs backdrop-blur-sm"
              >
                STUDIO
              </Badge>
            )}
          </Link>

          {/* Mobile-only: theme toggle stays up top next to logo */}
          <div className="md:hidden">
            <ThemeToggle />
          </div>
        </div>

        {/* Search — absolutely centered on the header itself on desktop,
            independent of how wide the logo or nav links are.
            On mobile it stays in normal flow (own full-width row). */}
        {!isAdminPage && (
          <Suspense
            fallback={
              <div className="h-11 w-full rounded-[5px] bg-white/40 backdrop-blur-md dark:bg-white/5 md:absolute md:left-1/2 md:top-1/2 md:w-full md:max-w-md md:-translate-x-1/2 md:-translate-y-1/2" />
            }
          >
            <div className="w-full md:absolute md:left-1/2 md:top-1/2 md:w-full md:max-w-md md:-translate-x-1/2 md:-translate-y-1/2">
              <SearchBar />
            </div>
          </Suspense>
        )}

        <Suspense
          fallback={
            <div className="hidden items-center gap-3 md:flex">
              <div className="h-9 w-9 animate-pulse rounded-[5px] bg-white/40 backdrop-blur-md dark:bg-white/5" />
              <div className="h-9 w-[60px] animate-pulse rounded-[5px] bg-white/40 backdrop-blur-md dark:bg-white/5" />
            </div>
          }
        >
          <NavLinks isAdminPage={isAdminPage} />
        </Suspense>
      </div>
    </header>
  );
}

async function NavLinks({ isAdminPage }: { isAdminPage: boolean }) {
  const user = await getCurrentUser({ allData: true });

  if (!user || !user.userId) {
    return (
      <div className="flex items-center justify-end gap-2 sm:gap-4">
        <Link
          href="/teach"
          className="hidden rounded-[5px] px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-white/50 hover:text-foreground sm:block dark:hover:bg-white/10"
        >
          Teach
        </Link>
        <div className="hidden md:block">
          <ThemeToggle />
        </div>
        <Button
          asChild
          size="sm"
          className="rounded-[5px] shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)]"
        >
          <Link href="/sign-up">Get Started</Link>
        </Button>
      </div>
    );
  }

  const isAdmin = canAccessAdminPages(user);

  if (isAdminPage) {
    return (
      <div className="flex items-center justify-end gap-3">
        <ThemeToggle />
        <Link
          href="/"
          className="rounded-[5px] px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-white/50 hover:text-foreground dark:hover:bg-white/10"
        >
          Exit Studio
        </Link>
      </div>
    );
  }

  const initials =
    user.user?.name
      ?.split(" ")
      .map((part: string) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() ?? null;

  return (
    <div className="flex items-center justify-end gap-2 sm:gap-3">
      <div className="hidden md:block">
        <ThemeToggle />
      </div>

      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-label="Account menu"
            className="flex items-center gap-1 rounded-[5px] p-0.5 transition-colors hover:bg-white/50 dark:hover:bg-white/10"
          >
            <span className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-white/30 bg-gradient-to-b from-primary to-primary/80 text-xs font-bold text-primary-foreground dark:border-white/10">
              {user.user?.image ? (
                <Image
                  src={user.user.image}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : initials ? (
                initials
              ) : (
                <User className="h-4 w-4" />
              )}
            </span>
            <ChevronDown className="hidden h-3.5 w-3.5 text-muted-foreground sm:block" />
          </button>
        </PopoverTrigger>

        <PopoverContent
          align="end"
          className="w-56 rounded-[5px] border-white/30 bg-white/80 p-1.5 backdrop-blur-2xl dark:border-white/10 dark:bg-black/70"
        >
          <div className="flex flex-col gap-0.5">
            {isAdmin && (
              <Link
                href="/admin"
                className="flex items-center gap-2 rounded-[5px] px-3 py-2 text-sm font-medium text-amber-600 transition-colors hover:bg-amber-500/10"
              >
                <Shield className="h-4 w-4" />
                Creator Studio
              </Link>
            )}
            {!isAdmin && (
              <Link
                href="/teach"
                className="flex items-center gap-2 rounded-[5px] px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-white/60 dark:hover:bg-white/10"
              >
                <Presentation className="h-4 w-4" />
                Teach
              </Link>
            )}
            <Link
              href="/courses"
              className="flex items-center gap-2 rounded-[5px] px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-white/60 dark:hover:bg-white/10"
            >
              <GraduationCap className="h-4 w-4" />
              My Courses
            </Link>
            <div className="my-1 h-px bg-white/20 dark:bg-white/10" />
            <Link
              href="/account"
              className="flex items-center gap-2 rounded-[5px] px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-white/60 dark:hover:bg-white/10"
            >
              <User className="h-4 w-4" />
              Profile
            </Link>
            <div className="md:hidden">
              <div className="my-1 h-px bg-white/20 dark:bg-white/10" />
              <div className="flex items-center justify-between px-3 py-2">
                <span className="text-sm font-medium text-muted-foreground">
                  Theme
                </span>
                <ThemeToggle />
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
