"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import {
  BarChart3Icon,
  BookOpenIcon,
  CreditCardIcon,
  FlagIcon,
  FolderIcon,
  LayoutDashboardIcon,
  LifeBuoyIcon,
  MenuIcon,
  PackageIcon,
  PercentIcon,
  RocketIcon,
  SparklesIcon,
  StarIcon,
  Undo2Icon,
  UsersIcon,
  WalletIcon,
  type LucideIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import type { AttentionCounts } from "../db/attention"

type Item = { href: string; label: string; icon: LucideIcon; count?: (c: AttentionCounts) => number; urgent?: boolean }

const GROUPS: { label: string; items: Item[] }[] = [
  {
    label: "Overview",
    items: [
      { href: "/admin", label: "Overview", icon: LayoutDashboardIcon },
      { href: "/admin/launch", label: "Launch metrics", icon: RocketIcon },
    ],
  },
  {
    label: "People",
    items: [
      { href: "/admin/users", label: "Users", icon: UsersIcon },
      { href: "/admin/creators", label: "Creators", icon: SparklesIcon },
    ],
  },
  {
    label: "Catalogue",
    items: [
      { href: "/admin/courses", label: "Courses", icon: BookOpenIcon },
      { href: "/admin/products", label: "Products", icon: PackageIcon, count: (c) => c.productsPending },
      { href: "/admin/categories", label: "Categories", icon: FolderIcon },
      { href: "/admin/reviews", label: "Reviews", icon: StarIcon },
    ],
  },
  {
    label: "Money",
    items: [
      {
        href: "/admin/purchases",
        label: "Payments",
        icon: CreditCardIcon,
        count: (c) => c.stuckPayments + c.disputedPayments,
        urgent: true,
      },
      { href: "/admin/refunds", label: "Refunds", icon: Undo2Icon, count: (c) => c.refunds },
      { href: "/admin/payouts", label: "Payouts", icon: WalletIcon, count: (c) => c.payouts },
      { href: "/admin/commissions", label: "Commissions", icon: PercentIcon },
      { href: "/admin/revenue", label: "Revenue", icon: BarChart3Icon },
    ],
  },
  {
    label: "Trust & support",
    items: [
      { href: "/admin/reports", label: "Reports", icon: FlagIcon, count: (c) => c.reports },
      { href: "/admin/support", label: "Support", icon: LifeBuoyIcon, count: (c) => c.openTickets },
    ],
  },
]

function isActive(pathname: string, href: string) {
  return href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(`${href}/`)
}

function Nav({ counts, onNavigate }: { counts: AttentionCounts; onNavigate?: () => void }) {
  const pathname = usePathname()
  return (
    <nav aria-label="Admin" className="flex flex-col gap-5">
      {GROUPS.map((group) => (
        <div key={group.label}>
          <p className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {group.label}
          </p>
          <ul className="flex flex-col gap-0.5">
            {group.items.map(({ href, label, icon: Icon, count, urgent }) => {
              const active = isActive(pathname, href)
              const n = count?.(counts) ?? 0
              return (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
                      active
                        ? "bg-primary/10 font-medium text-primary"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground",
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span className="flex-1 truncate">{label}</span>
                    {n > 0 && (
                      <span
                        className={cn(
                          "min-w-5 rounded-full px-1.5 text-center text-[11px] font-semibold leading-5",
                          urgent ? "bg-destructive text-white" : "bg-primary text-primary-foreground",
                        )}
                        aria-label={`${n} waiting`}
                      >
                        {n > 99 ? "99+" : n}
                      </span>
                    )}
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </nav>
  )
}

/** The admin's navigation: a sidebar on large screens, a slide-out menu on phones. */
export function AdminSidebar({ counts }: { counts: AttentionCounts }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <aside className="hidden w-60 shrink-0 lg:block">
        <div className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto pb-6">
          <Nav counts={counts} />
        </div>
      </aside>
      <div className="lg:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <MenuIcon className="h-4 w-4" /> Admin menu
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 overflow-y-auto">
            <SheetTitle className="px-3 pb-4 pt-2 text-lg font-semibold">Admin</SheetTitle>
            <div className="pb-6">
              <Nav counts={counts} onNavigate={() => setOpen(false)} />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  )
}
