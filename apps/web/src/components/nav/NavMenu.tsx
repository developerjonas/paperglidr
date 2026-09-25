"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { ChevronDown, ChevronRight, LogIn, Menu, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SearchBar } from "@/features/search/components/SearchBar";
import { cn } from "@/lib/utils";
import {
  accountSections,
  isActivePath,
  type NavContext,
  type NavItem,
  primaryLinks,
} from "./navItems";

export function DesktopLinks({ ctx }: { ctx: NavContext }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
      {primaryLinks(ctx).map(({ href, label }) => {
        const active = isActivePath(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "rounded-full px-3 py-1.5 text-[15px] transition-colors",
              active
                ? "font-medium text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

function Avatar({ ctx, size = "sm" }: { ctx: NavContext; size?: "sm" | "lg" }) {
  return (
    <span
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-secondary font-semibold text-foreground ring-1 ring-border",
        size === "sm" ? "h-8 w-8 text-xs" : "h-11 w-11 text-sm",
      )}
    >
      {ctx.image ? (
        <Image src={ctx.image} alt="" fill className="object-cover" />
      ) : ctx.initials ? (
        ctx.initials
      ) : (
        <User className="h-4 w-4 text-muted-foreground" />
      )}
    </span>
  );
}

function MenuLink({
  item,
  onNavigate,
  large = false,
}: {
  item: NavItem;
  onNavigate?: () => void;
  large?: boolean;
}) {
  const pathname = usePathname();
  const active = isActivePath(pathname, item.href);
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-3 rounded-xl px-3 font-medium transition-colors",
        large ? "py-2.5 text-[15px]" : "py-2 text-sm",
        item.tone === "admin"
          ? "text-amber-600 hover:bg-amber-500/10 dark:text-amber-400"
          : active
            ? "bg-accent text-foreground"
            : "text-foreground/80 hover:bg-accent hover:text-foreground",
      )}
    >
      {Icon && <Icon className="h-4 w-4 shrink-0 opacity-80" />}
      {item.label}
    </Link>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-3 pb-1 pt-3 text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
      {children}
    </div>
  );
}

/** Desktop: avatar menu when signed in, Log in + Get started otherwise. */
export function AccountMenu({ ctx }: { ctx: NavContext }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  useEffect(() => setOpen(false), [pathname]);

  if (!ctx.isLoggedIn) {
    return (
      <div className="hidden items-center gap-1 md:flex">
        <Link
          href="/sign-in"
          className="rounded-full px-3 py-1.5 text-[15px] text-muted-foreground transition-colors hover:text-foreground"
        >
          Log in
        </Link>
        <Button asChild size="sm" className="h-9 px-4 text-sm">
          <Link href="/sign-up">Get started</Link>
        </Button>
      </div>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Account menu"
          className="hidden items-center gap-1 rounded-full p-0.5 pr-1.5 transition-colors hover:bg-accent md:flex"
        >
          <Avatar ctx={ctx} />
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={10} className="w-64 rounded-2xl p-1.5">
        <div className="flex items-center gap-3 px-3 pb-2 pt-2">
          <Avatar ctx={ctx} />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{ctx.name ?? "Your account"}</p>
            {ctx.email && (
              <p className="truncate text-xs text-muted-foreground">{ctx.email}</p>
            )}
          </div>
        </div>
        {accountSections(ctx).map((section) => (
          <div key={section.label} className="border-t pt-0.5 first:border-t-0">
            <SectionLabel>{section.label}</SectionLabel>
            {section.items.map((item) => (
              <MenuLink key={item.href} item={item} />
            ))}
          </div>
        ))}
      </PopoverContent>
    </Popover>
  );
}

/** Mobile: hamburger that opens a sidebar drawer with everything in the header. */
export function MobileNav({ ctx }: { ctx: NavContext }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  useEffect(() => setOpen(false), [pathname]);
  const close = () => setOpen(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          aria-label="Open menu"
          className="flex h-10 w-10 items-center justify-center rounded-full text-foreground transition-colors hover:bg-accent md:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
      </SheetTrigger>
      <SheetContent side="right">
        <SheetTitle className="sr-only">Menu</SheetTitle>
        <SheetDescription className="sr-only">
          Site navigation and account links
        </SheetDescription>

        <div className="flex h-16 shrink-0 items-center border-b px-5">
          <Logo />
        </div>

        <div className="flex-1 overflow-y-auto px-3 pb-6 pt-4">
          <div className="px-2 pb-3">
            <Suspense fallback={<div className="h-10 rounded-full bg-secondary" />}>
              <SearchBar onNavigateAction={close} />
            </Suspense>
          </div>

          {ctx.isLoggedIn && (
            <div className="mx-2 mb-2 flex items-center gap-3 rounded-2xl bg-surface p-3 ring-1 ring-border">
              <Avatar ctx={ctx} size="lg" />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{ctx.name ?? "Your account"}</p>
                {ctx.email && (
                  <p className="truncate text-xs text-muted-foreground">{ctx.email}</p>
                )}
              </div>
            </div>
          )}

          <nav aria-label="Main" className="flex flex-col">
            {primaryLinks(ctx).map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={close}
                aria-current={isActivePath(pathname, item.href) ? "page" : undefined}
                className={cn(
                  "flex items-center justify-between rounded-xl px-3 py-3 text-lg font-semibold tracking-tight transition-colors hover:bg-accent",
                  isActivePath(pathname, item.href) ? "text-primary" : "text-foreground",
                )}
              >
                {item.label}
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            ))}
          </nav>

          {accountSections(ctx).map((section) => (
            <div key={section.label} className="mt-3 border-t pt-1">
              <SectionLabel>{section.label}</SectionLabel>
              {section.items.map((item) => (
                <MenuLink key={item.href} item={item} onNavigate={close} large />
              ))}
            </div>
          ))}
        </div>

        <div className="shrink-0 space-y-3 border-t bg-surface p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <ThemeToggle />
          {!ctx.isLoggedIn && (
            <div className="grid grid-cols-2 gap-2">
              <Button asChild variant="outline">
                <Link href="/sign-in" onClick={close}>
                  <LogIn /> Log in
                </Link>
              </Button>
              <Button asChild>
                <Link href="/sign-up" onClick={close}>
                  Get started
                </Link>
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
