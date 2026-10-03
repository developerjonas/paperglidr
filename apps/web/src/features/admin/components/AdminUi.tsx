import Link from "next/link"
import type { ReactNode } from "react"
import { ArrowRightIcon } from "lucide-react"
import { formatPrice } from "@/lib/formatters"
import { cn } from "@/lib/utils"

// Shared pieces of the admin pages, so they look and read the same.

/** Paisa as rupees, e.g. 149900 → "Rs 1,499" (0 → "Rs 0", not "Free"). */
export const nprFromPaisa = (paisa: number) => formatPrice(paisa / 100, { showZeroAsNumber: true })

export const shortDate = (date: Date | string | null | undefined) =>
  date ? new Date(date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—"
export const shortDateTime = (date: Date | string | null | undefined) =>
  date
    ? new Date(date).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
    : "—"

export function AdminPageHeader({ title, description, children }: { title: string; description?: ReactNode; children?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="mt-1 max-w-3xl text-sm text-muted-foreground">{description}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  )
}

export function StatCard({ label, value, note, href }: { label: string; value: ReactNode; note?: ReactNode; href?: string }) {
  const body = (
    <>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight">{value}</p>
      {note && <p className="mt-1 text-xs text-muted-foreground">{note}</p>}
    </>
  )
  const className = "rounded-xl border border-border bg-card p-4 shadow-sm"
  return href ? (
    <Link href={href} className={cn(className, "transition-colors hover:bg-accent")}>
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  )
}

/** A to-do with a count: highlighted when something is waiting. */
export function AttentionCard({ label, count, description, href, urgent = false }: {
  label: string
  count: number
  description: string
  href: string
  urgent?: boolean
}) {
  const waiting = count > 0
  return (
    <Link
      href={href}
      className={cn(
        "group flex flex-col justify-between gap-3 rounded-xl border p-4 shadow-sm transition-colors",
        waiting
          ? urgent
            ? "border-destructive/40 bg-destructive/5 hover:bg-destructive/10"
            : "border-primary/30 bg-primary/5 hover:bg-primary/10"
          : "border-border bg-card hover:bg-accent",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium">{label}</p>
        <span
          className={cn(
            "text-2xl font-semibold leading-none",
            waiting ? (urgent ? "text-destructive" : "text-primary") : "text-muted-foreground",
          )}
        >
          {count}
        </span>
      </div>
      <p className="flex items-center gap-1 text-xs text-muted-foreground">
        {waiting ? description : "Nothing waiting"}
        <ArrowRightIcon className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
      </p>
    </Link>
  )
}

const TONES: Record<string, string> = {
  good: "bg-success/15 text-success",
  warn: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  bad: "bg-destructive/15 text-destructive",
  info: "bg-primary/10 text-primary",
  neutral: "bg-muted text-muted-foreground",
}

const STATUS_TONE: Record<string, keyof typeof TONES> = {
  // purchases
  completed: "good",
  pending: "warn",
  failed: "bad",
  disputed: "bad",
  refunded: "neutral",
  // payment events / invoices
  initiated: "info",
  already_completed: "good",
  expired: "neutral",
  error: "bad",
  issued: "good",
  void: "neutral",
  // products / courses
  public: "good",
  private: "neutral",
  pending_review: "warn",
  free: "good",
  paid: "info",
  draft: "neutral",
  // refunds / payouts / reports / tickets
  approved: "warn",
  processed: "good",
  denied: "neutral",
  requested: "warn",
  rejected: "neutral",
  open: "warn",
  in_progress: "info",
  resolved: "good",
  closed: "neutral",
  reviewing: "info",
  dismissed: "neutral",
  action_taken: "good",
  // users
  admin: "info",
  deleted: "neutral",
}

/** A coloured pill for any status value. */
export function StatusBadge({ status, label }: { status: string; label?: string }) {
  const tone = TONES[STATUS_TONE[status] ?? "neutral"]
  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", tone)}>
      {label ?? status.replaceAll("_", " ")}
    </span>
  )
}

/** Links that switch a list's filter, kept in the URL. */
export function FilterTabs({ options, current, hrefFor, label }: {
  options: { value: string; label: string; count?: number }[]
  current: string
  hrefFor: (value: string) => string
  label: string
}) {
  return (
    <nav aria-label={label} className="flex flex-wrap gap-1 rounded-lg border border-border p-1 text-sm">
      {options.map((option) => (
        <Link
          key={option.value}
          href={hrefFor(option.value)}
          aria-current={option.value === current ? "page" : undefined}
          className={cn(
            "rounded-md px-3 py-1",
            option.value === current ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent",
          )}
        >
          {option.label}
          {option.count != null && <span className="ml-1.5 opacity-70">{option.count}</span>}
        </Link>
      ))}
    </nav>
  )
}

/** A GET search box (keeps other filters via hidden inputs). */
export function SearchForm({ placeholder, value, hidden = {} }: { placeholder: string; value?: string; hidden?: Record<string, string | undefined> }) {
  return (
    <form method="get" className="flex gap-2" role="search">
      {Object.entries(hidden).map(([name, v]) => (v ? <input key={name} type="hidden" name={name} value={v} /> : null))}
      <input
        type="search"
        name="q"
        defaultValue={value}
        placeholder={placeholder}
        aria-label={placeholder}
        className="h-9 w-64 max-w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
      />
      <button type="submit" className="h-9 rounded-md border border-input px-3 text-sm hover:bg-accent">
        Search
      </button>
    </form>
  )
}

/** Previous/next page links for a paged list. */
export function Pager({ page, hasMore, hrefFor }: { page: number; hasMore: boolean; hrefFor: (page: number) => string }) {
  if (page === 1 && !hasMore) return null
  return (
    <div className="flex items-center justify-end gap-2 text-sm">
      {page > 1 && (
        <Link href={hrefFor(page - 1)} className="rounded-md border border-input px-3 py-1 hover:bg-accent">
          ← Previous
        </Link>
      )}
      <span className="text-muted-foreground">Page {page}</span>
      {hasMore && (
        <Link href={hrefFor(page + 1)} className="rounded-md border border-input px-3 py-1 hover:bg-accent">
          Next →
        </Link>
      )}
    </div>
  )
}
