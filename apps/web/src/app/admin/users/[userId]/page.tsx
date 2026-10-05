import Link from "next/link"
import { notFound } from "next/navigation"
import type { ReactNode } from "react"
import { ActionButton } from "@/components/ActionButton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AdminPageHeader, StatusBadge, nprFromPaisa, shortDate, shortDateTime, gatewayName } from "@/features/admin/components/AdminUi"
import { DeleteUserButton, GrantCourseForm, StorageLimitForm } from "@/features/admin/components/UserControls"
import { revokeCourseAccess, sendPasswordResetEmail, setUserRole, signOutEverywhere } from "@/features/admin/actions/users"
import { getUserDetail } from "@/features/admin/db/users"
import { requireAdmin } from "@/services/auth"

const SIGN_IN_LABELS: Record<string, string> = { credential: "Password", google: "Google", github: "GitHub" }

function Section({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  return (
    <section className="flex min-w-0 flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-semibold">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  )
}

function Empty({ children }: { children: ReactNode }) {
  return <p className="text-sm text-muted-foreground">{children}</p>
}

export default async function AdminUserPage({ params }: { params: Promise<{ userId: string }> }) {
  const admin = await requireAdmin()
  const { userId } = await params
  if (!/^[0-9a-f-]{36}$/i.test(userId)) notFound()
  const detail = await getUserDetail(userId)
  if (detail == null) notFound()
  const { user, instructor } = detail
  const deleted = user.deletedAt != null
  const self = user.id === admin.userId

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/admin/users" className="text-sm text-muted-foreground hover:underline">
          ← Users
        </Link>
      </div>
      <AdminPageHeader
        title={user.name}
        description={
          <>
            {deleted ? "Deleted account" : user.email}
            {user.username && ` · @${user.displayUsername ?? user.username}`} · joined {shortDate(user.createdAt)}
          </>
        }
      >
        {deleted && <StatusBadge status="deleted" />}
        {user.role === "admin" && <StatusBadge status="admin" />}
        {instructor && <StatusBadge status="paid" label="creator" />}
      </AdminPageHeader>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="flex min-w-0 flex-col gap-6 xl:col-span-2">
          <Section title="Purchases" action={<span className="text-xs text-muted-foreground">latest 25</span>}>
            {detail.purchases.length === 0 ? (
              <Empty>No purchases.</Empty>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>When</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Gateway</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {detail.purchases.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="whitespace-nowrap text-sm text-muted-foreground">{shortDateTime(p.createdAt)}</TableCell>
                      <TableCell>
                        <Link href={`/admin/purchases/${p.id}`} className="font-medium hover:underline">
                          {p.product}
                        </Link>
                      </TableCell>
                      <TableCell className="text-sm">{gatewayName(p.gateway)}</TableCell>
                      <TableCell className="text-right tabular-nums">{nprFromPaisa(p.paisa)}</TableCell>
                      <TableCell>
                        <StatusBadge status={p.status} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Section>

          <Section title="Courses">
            {detail.courses.length === 0 ? (
              <Empty>No course access.</Empty>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Course</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Since</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {detail.courses.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>
                        <Link href={`/admin/courses/${c.id}`} className="font-medium hover:underline">
                          {c.name}
                        </Link>
                      </TableCell>
                      <TableCell className="text-sm tabular-nums">
                        {c.done}/{c.total} lessons{c.total > 0 && ` (${Math.round((100 * c.done) / c.total)}%)`}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm text-muted-foreground">{shortDate(c.since)}</TableCell>
                      <TableCell className="text-right">
                        <ActionButton
                          action={revokeCourseAccess.bind(null, user.id, c.id)}
                          requireAreYouSure
                          variant="ghost"
                          size="sm"
                        >
                          Remove
                        </ActionButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            {!deleted && (
              <div className="border-t border-border pt-3">
                <p className="mb-2 text-sm font-medium">Give a course</p>
                <GrantCourseForm userId={user.id} />
                <p className="mt-2 text-xs text-muted-foreground">
                  For support cases and gifts. No purchase or invoice is recorded, and removing access doesn&apos;t refund anything.
                </p>
              </div>
            )}
          </Section>

          <div className="grid min-w-0 gap-6 md:grid-cols-2">
            <Section title="Support tickets">
              {detail.tickets.length === 0 ? (
                <Empty>None.</Empty>
              ) : (
                <ul className="flex flex-col gap-2 text-sm">
                  {detail.tickets.map((t) => (
                    <li key={t.id} className="flex items-center justify-between gap-2">
                      <Link href={`/admin/support/${t.id}`} className="truncate hover:underline">
                        {t.subject}
                      </Link>
                      <StatusBadge status={t.status} />
                    </li>
                  ))}
                </ul>
              )}
            </Section>
            <Section title="Refund requests">
              {detail.refunds.length === 0 ? (
                <Empty>None.</Empty>
              ) : (
                <ul className="flex flex-col gap-2 text-sm">
                  {detail.refunds.map((r) => (
                    <li key={r.id} className="flex items-center justify-between gap-2">
                      <Link href="/admin/refunds" className="hover:underline">
                        {shortDate(r.createdAt)}
                      </Link>
                      <StatusBadge status={r.status} />
                    </li>
                  ))}
                </ul>
              )}
            </Section>
          </div>

          <Section title="Certificates">
            {detail.certificates.length === 0 ? (
              <Empty>None yet.</Empty>
            ) : (
              <ul className="flex flex-col gap-2 text-sm">
                {detail.certificates.map((c) => (
                  <li key={c.id} className="flex items-center justify-between gap-2">
                    <span>
                      {c.course} <span className="text-muted-foreground">· {shortDate(c.issuedAt)}</span>
                    </span>
                    <span className="flex items-center gap-2">
                      {c.revoked && <StatusBadge status="failed" label="revoked" />}
                      <Link href={`/verify/${c.code}`} className="font-mono text-xs text-primary hover:underline">
                        {c.code}
                      </Link>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </div>

        <div className="flex min-w-0 flex-col gap-6">
          <Section title="Account">
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
              <dt className="text-muted-foreground">Signs in with</dt>
              <dd>{detail.signInMethods.map((m) => SIGN_IN_LABELS[m] ?? m).join(", ") || "—"}</dd>
              <dt className="text-muted-foreground">Email verified</dt>
              <dd>{user.emailVerified ? "Yes" : "No"}</dd>
              <dt className="text-muted-foreground">Signed in on</dt>
              <dd>{detail.activeSessions} device(s)</dd>
              <dt className="text-muted-foreground">Last active</dt>
              <dd>{shortDateTime(detail.lastSeen)}</dd>
              <dt className="text-muted-foreground">User ID</dt>
              <dd className="break-all font-mono text-xs">{user.id}</dd>
            </dl>
          </Section>

          {instructor && (
            <Section title="Creator profile" action={<Link href="/admin/creators" className="text-sm text-primary hover:underline">Creators →</Link>}>
              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
                <dt className="text-muted-foreground">Page</dt>
                <dd>
                  <Link href={`/instructors/${instructor.handle}`} className="text-primary hover:underline">
                    @{instructor.handle}
                  </Link>
                </dd>
                <dt className="text-muted-foreground">Verified</dt>
                <dd>{instructor.isVerified ? "Yes" : "No"}</dd>
                <dt className="text-muted-foreground">Founding</dt>
                <dd>{instructor.isFounding ? "Yes" : "No"}</dd>
                <dt className="text-muted-foreground">Phone verified</dt>
                <dd>{instructor.phoneVerifiedAt ? shortDate(instructor.phoneVerifiedAt) : "No"}</dd>
                <dt className="text-muted-foreground">Creator terms</dt>
                <dd>{instructor.termsAcceptedAt ? `Accepted ${shortDate(instructor.termsAcceptedAt)}` : "Not accepted"}</dd>
              </dl>
              <div className="border-t border-border pt-3">
                <p className="mb-2 text-sm font-medium">Upload storage</p>
                <StorageLimitForm
                  userId={user.id}
                  usedBytes={Number(instructor.storageUsedBytes)}
                  limitBytes={Number(instructor.storageLimitBytes)}
                />
              </div>
              <Link href={`/admin/commissions?creator=${user.id}`} className="text-sm text-primary hover:underline">
                Earnings and balance →
              </Link>
            </Section>
          )}

          {!deleted && (
            <Section title="Actions">
              <div className="flex flex-col items-start gap-2">
                <ActionButton action={sendPasswordResetEmail.bind(null, user.id)} variant="outline" size="sm" disabled={!detail.signInMethods.includes("credential")}>
                  Send password reset email
                </ActionButton>
                <ActionButton action={signOutEverywhere.bind(null, user.id)} requireAreYouSure variant="outline" size="sm" disabled={detail.activeSessions === 0}>
                  Sign out of every device
                </ActionButton>
                {!self &&
                  (user.role === "admin" ? (
                    <ActionButton action={setUserRole.bind(null, user.id, "user")} requireAreYouSure variant="outline" size="sm">
                      Remove admin role
                    </ActionButton>
                  ) : (
                    <ActionButton action={setUserRole.bind(null, user.id, "admin")} requireAreYouSure variant="outline" size="sm">
                      Make admin
                    </ActionButton>
                  ))}
                {!self && user.role !== "admin" && <DeleteUserButton userId={user.id} email={user.email} />}
              </div>
              {!detail.signInMethods.includes("credential") && (
                <p className="text-xs text-muted-foreground">No password on this account (Google/GitHub sign-in), so there&apos;s nothing to reset.</p>
              )}
            </Section>
          )}
        </div>
      </div>
    </div>
  )
}
