import "server-only"
import { sql } from "drizzle-orm"
import { db } from "@/drizzle/db"

// The admin's user directory and per-user detail.

export const USER_FILTERS = ["all", "learners", "creators", "admins", "deleted"] as const
export type UserFilter = (typeof USER_FILTERS)[number]
export const USERS_PAGE_SIZE = 50

export type AdminUserRow = {
  id: string
  name: string
  email: string
  username: string | null
  role: "user" | "admin"
  createdAt: Date
  deletedAt: Date | null
  isCreator: boolean
  courses: number
  paidPurchases: number
}

export async function listUsers({ q, filter, page }: { q?: string; filter: UserFilter; page: number }) {
  const term = q?.trim() ? `%${q.trim()}%` : null
  const where = sql.join(
    [
      filter === "deleted" ? sql`u.deleted_at is not null` : sql`u.deleted_at is null`,
      filter === "admins" ? sql`u.role = 'admin'` : sql`true`,
      filter === "creators" ? sql`i.id is not null` : sql`true`,
      filter === "learners" ? sql`i.id is null and u.role = 'user'` : sql`true`,
      term ? sql`(u.name ilike ${term} or u.email ilike ${term} or u.username ilike ${term})` : sql`true`,
    ],
    sql` and `,
  )
  const result = await db.execute(sql`
    select u.id, u.name, u.email, u.username, u.role, u.created_at, u.deleted_at, (i.id is not null) as is_creator,
      (select count(*) from user_course_access a where a."userId" = u.id) as courses,
      (select count(*) from purchases p where p."userId" = u.id and p.gateway <> 'free' and p.status in ('completed', 'refunded')) as paid
    from "user" u left join instructors i on i."userId" = u.id
    where ${where}
    order by u.created_at desc
    limit ${USERS_PAGE_SIZE + 1} offset ${(page - 1) * USERS_PAGE_SIZE}
  `)
  const rows = (result.rows as Record<string, unknown>[]).map(
    (r): AdminUserRow => ({
      id: String(r.id),
      name: String(r.name),
      email: String(r.email),
      username: r.username == null ? null : String(r.username),
      role: r.role === "admin" ? "admin" : "user",
      createdAt: new Date(String(r.created_at)),
      deletedAt: r.deleted_at == null ? null : new Date(String(r.deleted_at)),
      isCreator: Boolean(r.is_creator),
      courses: Number(r.courses),
      paidPurchases: Number(r.paid),
    }),
  )
  return { rows: rows.slice(0, USERS_PAGE_SIZE), hasMore: rows.length > USERS_PAGE_SIZE }
}

export async function getUserFilterCounts(): Promise<Record<UserFilter, number>> {
  const result = await db.execute(sql`
    select
      count(*) filter (where u.deleted_at is null) as all_users,
      count(*) filter (where u.deleted_at is null and i.id is null and u.role = 'user') as learners,
      count(*) filter (where u.deleted_at is null and i.id is not null) as creators,
      count(*) filter (where u.deleted_at is null and u.role = 'admin') as admins,
      count(*) filter (where u.deleted_at is not null) as deleted
    from "user" u left join instructors i on i."userId" = u.id
  `)
  const r = result.rows[0] as Record<string, unknown>
  return {
    all: Number(r.all_users),
    learners: Number(r.learners),
    creators: Number(r.creators),
    admins: Number(r.admins),
    deleted: Number(r.deleted),
  }
}

/** Everything an admin needs to help one user. Null if there's no such user. */
export async function getUserDetail(userId: string) {
  const user = await db.query.UserTable.findFirst({ where: (u, { eq }) => eq(u.id, userId) })
  if (!user) return null
  const q = async (query: ReturnType<typeof sql>) => (await db.execute(query)).rows as Record<string, unknown>[]

  const [accounts, sessions, instructor, purchases, access, certificates, tickets, refunds] = await Promise.all([
    q(sql`select provider_id from account where user_id = ${userId}`),
    q(sql`select count(*) as n, max(updated_at) as last_seen from session where user_id = ${userId} and expires_at > now()`),
    q(sql`select handle, name, "isVerified", is_founding as "isFounding", phone_verified_at as "phoneVerifiedAt",
            creator_terms_accepted_at as "termsAcceptedAt"
          from instructors where "userId" = ${userId}`),
    q(sql`select id, status, gateway, "pricePaidInPaisa" as paisa, "createdAt" as created_at, "productDetails"->>'name' as product
          from purchases where "userId" = ${userId} order by "createdAt" desc limit 25`),
    q(sql`select c.id, c.name, a."createdAt" as created_at,
            (select count(*) from user_lesson_complete ulc join lessons l on l.id = ulc."lessonId"
               join course_sections s on s.id = l."sectionId" where ulc."userId" = ${userId} and s."courseId" = c.id) as done,
            (select count(*) from lessons l join course_sections s on s.id = l."sectionId"
               where s."courseId" = c.id and s.status = 'public' and l.status <> 'private') as total
          from user_course_access a join courses c on c.id = a."courseId" where a."userId" = ${userId} order by a."createdAt" desc`),
    q(sql`select id, "certificateCode" as code, "courseTitleSnapshot" as course, "issuedAt" as issued_at, "revokedAt" as revoked_at
          from certificates where "userId" = ${userId} order by "issuedAt" desc`),
    q(sql`select id, subject, status, "createdAt" as created_at from support_tickets where user_id = ${userId} order by "createdAt" desc limit 10`),
    q(sql`select id, status, "createdAt" as created_at from refund_requests where "userId" = ${userId} order by "createdAt" desc limit 10`),
  ])

  return {
    user,
    signInMethods: accounts.map((a) => String(a.provider_id)),
    activeSessions: Number(sessions[0]?.n ?? 0),
    lastSeen: sessions[0]?.last_seen ? new Date(String(sessions[0].last_seen)) : null,
    instructor: (instructor[0] ?? null) as null | {
      handle: string
      name: string
      isVerified: boolean
      isFounding: boolean
      phoneVerifiedAt: Date | null
      termsAcceptedAt: Date | null
    },
    purchases: purchases.map((p) => ({
      id: String(p.id),
      status: String(p.status),
      gateway: String(p.gateway),
      paisa: Number(p.paisa),
      createdAt: new Date(String(p.created_at)),
      product: String(p.product ?? "—"),
    })),
    courses: access.map((a) => ({
      id: String(a.id),
      name: String(a.name),
      since: new Date(String(a.created_at)),
      done: Number(a.done),
      total: Number(a.total),
    })),
    certificates: certificates.map((c) => ({
      id: String(c.id),
      code: String(c.code),
      course: String(c.course),
      issuedAt: new Date(String(c.issued_at)),
      revoked: c.revoked_at != null,
    })),
    tickets: tickets.map((t) => ({ id: String(t.id), subject: String(t.subject), status: String(t.status), createdAt: new Date(String(t.created_at)) })),
    refunds: refunds.map((r) => ({ id: String(r.id), status: String(r.status), createdAt: new Date(String(r.created_at)) })),
  }
}

/** Courses matching a search, for the "Give a course" picker (name or creator; newest first). */
export async function searchCoursesForGrant(q: string, limit = 20) {
  const term = `%${q.trim()}%`
  const result = await db.execute(sql`
    select c.id, c.name, u.name as author from courses c join "user" u on u.id = c.author_id
    where c.name ilike ${term} or u.name ilike ${term}
    order by c."createdAt" desc limit ${limit}
  `)
  return (result.rows as Record<string, unknown>[]).map((r) => ({ id: String(r.id), name: String(r.name), author: String(r.author) }))
}
