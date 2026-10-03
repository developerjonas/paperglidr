import Link from "next/link"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AdminPageHeader, FilterTabs, Pager, SearchForm, StatusBadge, shortDate } from "@/features/admin/components/AdminUi"
import { USER_FILTERS, type UserFilter, getUserFilterCounts, listUsers } from "@/features/admin/db/users"
import { requireAdmin } from "@/services/auth"

const FILTER_LABELS: Record<UserFilter, string> = {
  all: "All",
  learners: "Learners",
  creators: "Creators",
  admins: "Admins",
  deleted: "Deleted",
}

export default async function AdminUsersPage({ searchParams }: { searchParams: Promise<{ q?: string; filter?: string; page?: string }> }) {
  await requireAdmin()
  const params = await searchParams
  const filter: UserFilter = (USER_FILTERS as readonly string[]).includes(params.filter ?? "") ? (params.filter as UserFilter) : "all"
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1)
  const q = params.q?.trim() || undefined

  const [{ rows, hasMore }, counts] = await Promise.all([listUsers({ q, filter, page }), getUserFilterCounts()])
  const href = (next: { filter?: string; page?: number }) => {
    const search = new URLSearchParams()
    const f = next.filter ?? filter
    if (f !== "all") search.set("filter", f)
    if (q) search.set("q", q)
    if (next.page && next.page > 1) search.set("page", String(next.page))
    const s = search.toString()
    return s ? `/admin/users?${s}` : "/admin/users"
  }

  return (
    <div className="flex flex-col gap-4">
      <AdminPageHeader
        title="Users"
        description="Everyone with an account. Open a user to see their purchases, courses and tickets, give or remove a course, send a password reset or delete the account."
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <FilterTabs
          label="Filter users"
          current={filter}
          hrefFor={(value) => href({ filter: value })}
          options={USER_FILTERS.map((value) => ({ value, label: FILTER_LABELS[value], count: counts[value] }))}
        />
        <SearchForm placeholder="Name, email or username" value={q} hidden={{ filter: filter === "all" ? undefined : filter }} />
      </div>

      {rows.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          {q ? `No users match "${q}".` : "No users here."}
        </p>
      ) : (
        <div className="rounded-xl border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Courses</TableHead>
                <TableHead className="text-right">Paid purchases</TableHead>
                <TableHead>Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <Link href={`/admin/users/${user.id}`} className="font-medium hover:underline">
                      {user.name}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {user.deletedAt ? "—" : user.email}
                      {user.username && !user.deletedAt ? ` · @${user.username}` : ""}
                    </p>
                  </TableCell>
                  <TableCell className="space-x-1">
                    {user.deletedAt ? (
                      <StatusBadge status="deleted" />
                    ) : (
                      <>
                        {user.role === "admin" && <StatusBadge status="admin" />}
                        {user.isCreator && <StatusBadge status="paid" label="creator" />}
                        {user.role !== "admin" && !user.isCreator && <StatusBadge status="private" label="learner" />}
                      </>
                    )}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{user.courses}</TableCell>
                  <TableCell className="text-right tabular-nums">{user.paidPurchases}</TableCell>
                  <TableCell className="whitespace-nowrap text-sm text-muted-foreground">{shortDate(user.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      <Pager page={page} hasMore={hasMore} hrefFor={(p) => href({ page: p })} />
    </div>
  )
}
