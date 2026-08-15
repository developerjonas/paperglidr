import Link from "next/link";
import { Suspense } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { canAccessAdminPages } from "@/permissions/general";
import { getCurrentUser } from "@/services/clerk";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SearchBar } from "@/features/products/components/SearchBar";
import { db } from "@/drizzle/db";
import { InstructorTable } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import {
  Shield,
  User,
  GraduationCap,
  Presentation,
  ChevronDown,
  Briefcase,
  CoinsIcon,
  BookOpen,
  Package,
  DollarSign,
  Wallet,
  LogIn,
  UserPlus,
  SearchIcon,
} from "lucide-react";
import Image from "next/image";

type NavbarProps = {
  isAdminPage?: boolean;
};

export function Navbar({ isAdminPage = false }: NavbarProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/20 bg-white/60 shadow-[0_1px_0_0_rgba(255,255,255,0.5)_inset,0_8px_30px_-12px_rgba(0,0,0,0.1)] backdrop-blur-2xl backdrop-saturate-150 dark:border-white/10 dark:bg-black/40 dark:shadow-[0_1px_0_0_rgba(255,255,255,0.06)_inset,0_8px_30px_-12px_rgba(0,0,0,0.5)]">
      <div className="container relative flex h-16 items-center justify-between gap-2 px-4 sm:px-8">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 text-xl font-extrabold tracking-tight"
        >
          PAPERGLIDR
          {isAdminPage && (
            <Badge
              variant="secondary"
              className="ml-1 rounded-[5px] border border-amber-500/30 bg-amber-500/10 text-xs text-amber-600 backdrop-blur-sm"
            >
              STUDIO
            </Badge>
          )}
        </Link>

        {/* Desktop Search */}
        {!isAdminPage && (
          <Suspense
            fallback={
              <div className="hidden h-11 w-full max-w-md rounded-[5px] bg-white/40 backdrop-blur-md dark:bg-white/5 md:absolute md:left-1/2 md:top-1/2 md:block md:-translate-x-1/2 md:-translate-y-1/2" />
            }
          >
            <div className="hidden md:absolute md:left-1/2 md:top-1/2 md:block md:w-full md:max-w-md md:-translate-x-1/2 md:-translate-y-1/2">
              <SearchBar />
            </div>
          </Suspense>
        )}

        <Suspense
          fallback={
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 animate-pulse rounded-full bg-white/40 backdrop-blur-md dark:bg-white/5" />
            </div>
          }
        >
          <NavLinks isAdminPage={isAdminPage} />
        </Suspense>
      </div>
    </header>
  );
}

function GroupLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
      {children}
    </div>
  );
}

async function NavLinks({ isAdminPage }: { isAdminPage: boolean }) {
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

  const initials =
    user?.user?.name
      ?.split(" ")
      .map((part: string) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() ?? null;

  if (isAdminPage) {
    return (
      <div className="flex items-center justify-end gap-3">
        <Link
          href="/"
          className="rounded-[5px] px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-white/50 hover:text-foreground dark:hover:bg-white/10"
        >
          Exit Studio
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-end gap-2">
      {/* Mobile Search Button -> /browse */}
      <MobileSearchTrigger />

      {/* Unified Account Popover (Guest & Logged-In) */}
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-label="Account menu"
            className="flex items-center gap-1 rounded-[5px] p-0.5 transition-colors hover:bg-white/50 dark:hover:bg-white/10"
          >
            <span className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-white/30 bg-muted text-xs font-bold text-foreground dark:border-white/10">
              {user?.user?.image ? (
                <Image
                  src={user.user.image}
                  alt="User Avatar"
                  fill
                  className="object-cover"
                />
              ) : initials ? (
                initials
              ) : (
                <User className="h-4 w-4 text-muted-foreground" />
              )}
            </span>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </PopoverTrigger>

        <PopoverContent
          align="end"
          className="w-56 rounded-[5px] border-white/30 bg-white/80 p-1.5 backdrop-blur-2xl dark:border-white/10 dark:bg-black/70"
        >
          <div className="flex flex-col gap-0.5">
            {!isLoggedIn ? (
              /* GUEST CONTENT */
              <>
                <Link
                  href="/sign-in"
                  className="flex items-center gap-2 rounded-[5px] px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-white/60 dark:hover:bg-white/10"
                >
                  <LogIn className="h-4 w-4" />
                  Log in
                </Link>
                <Link
                  href="/sign-up"
                  className="flex items-center gap-2 rounded-[5px] px-3 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/10"
                >
                  <UserPlus className="h-4 w-4" />
                  Sign up
                </Link>
                <div className="my-1 h-px bg-white/20 dark:bg-white/10" />
                <Link
                  href="/teach"
                  className="flex items-center gap-2 rounded-[5px] px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-white/60 dark:hover:bg-white/10"
                >
                  <Presentation className="h-4 w-4" />
                  Teach on Paperglidr
                </Link>
              </>
            ) : (
              /* LOGGED-IN CONTENT */
              <>
                <GroupLabel>Learning</GroupLabel>
                <Link
                  href="/courses"
                  className="flex items-center gap-2 rounded-[5px] px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-white/60 dark:hover:bg-white/10"
                >
                  <GraduationCap className="h-4 w-4" />
                  My Courses
                </Link>
                <Link
                  href="/certificates"
                  className="flex items-center gap-2 rounded-[5px] px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-white/60 dark:hover:bg-white/10"
                >
                  <Briefcase className="h-4 w-4" />
                  My Certificates
                </Link>
                <Link
                  href="/purchases"
                  className="flex items-center gap-2 rounded-[5px] px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-white/60 dark:hover:bg-white/10"
                >
                  <CoinsIcon className="h-4 w-4" />
                  My Purchases
                </Link>

                <div className="my-1 h-px bg-white/20 dark:bg-white/10" />

                {isAdmin ? (
                  <>
                    <GroupLabel>Admin</GroupLabel>
                    <Link
                      href="/admin"
                      className="flex items-center gap-2 rounded-[5px] px-3 py-2 text-sm font-medium text-amber-600 transition-colors hover:bg-amber-500/10"
                    >
                      <Shield className="h-4 w-4" />
                      Creator Studio
                    </Link>
                  </>
                ) : isInstructor ? (
                  <>
                    <GroupLabel>Teaching</GroupLabel>
                    <Link
                      href="/teach/courses"
                      className="flex items-center gap-2 rounded-[5px] px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-white/60 dark:hover:bg-white/10"
                    >
                      <BookOpen className="h-4 w-4" />
                      Courses
                    </Link>
                    <Link
                      href="/teach/products"
                      className="flex items-center gap-2 rounded-[5px] px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-white/60 dark:hover:bg-white/10"
                    >
                      <Package className="h-4 w-4" />
                      Products
                    </Link>
                    <Link
                      href="/teach/sales"
                      className="flex items-center gap-2 rounded-[5px] px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-white/60 dark:hover:bg-white/10"
                    >
                      <DollarSign className="h-4 w-4" />
                      Sales
                    </Link>
                    <Link
                      href="/teach/payouts"
                      className="flex items-center gap-2 rounded-[5px] px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-white/60 dark:hover:bg-white/10"
                    >
                      <Wallet className="h-4 w-4" />
                      Payouts
                    </Link>
                  </>
                ) : (
                  <Link
                    href="/instructors/onboarding"
                    className="flex items-center gap-2 rounded-[5px] px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-white/60 dark:hover:bg-white/10"
                  >
                    <Presentation className="h-4 w-4" />
                    Become a Tutor
                  </Link>
                )}

                <div className="my-1 h-px bg-white/20 dark:bg-white/10" />

                <Link
                  href="/account"
                  className="flex items-center gap-2 rounded-[5px] px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-white/60 dark:hover:bg-white/10"
                >
                  <User className="h-4 w-4" />
                  Profile
                </Link>
              </>
            )}

            {/* COMMON FOOTER */}
            <div className="my-1 h-px bg-white/20 dark:bg-white/10" />
            <GroupLabel>Appearance</GroupLabel>
            <div className="px-1 pb-1">
              <ThemeToggle />
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

export function MobileSearchTrigger() {
  return (
    <Link
      href="/browse"
      aria-label="Search"
      className="flex h-9 w-9 items-center justify-center rounded-[5px] text-muted-foreground transition-colors hover:bg-white/50 hover:text-foreground md:hidden dark:hover:bg-white/10"
    >
      <SearchIcon className="h-5 w-5" />
    </Link>
  );
}
