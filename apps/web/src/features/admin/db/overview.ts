import "server-only"
import { sql } from "drizzle-orm"
import { db } from "@/drizzle/db"

// Headline numbers and recent activity for the admin Overview.

export async function getCatalogueTotals() {
  const result = await db.execute(sql`
    select
      (select count(*) from "user" where deleted_at is null) as users,
      (select count(*) from instructors) as creators,
      (select count(*) from products where status = 'public') as live_products,
      (select count(*) from courses) as courses,
      (select count(distinct "userId") from user_course_access) as students,
      (select coalesce(sum("platformFeePaisa"), 0) from ledger_entries where "createdAt" >= now() - interval '30 days') as fee_30d
  `)
  const row = result.rows[0] as Record<string, unknown>
  const n = (key: string) => Number(row[key] ?? 0)
  return {
    users: n("users"),
    creators: n("creators"),
    liveProducts: n("live_products"),
    courses: n("courses"),
    students: n("students"),
    platformFee30dPaisa: n("fee_30d"),
  }
}

export async function getRecentPurchases(limit = 8) {
  const result = await db.execute(sql`
    select p.id, p.status, p.gateway, p."pricePaidInPaisa" as paisa, p."createdAt" as created_at,
           p."productDetails"->>'name' as product, u.name as buyer, u.email
    from purchases p join "user" u on u.id = p."userId"
    order by p."createdAt" desc limit ${limit}
  `)
  return (result.rows as Record<string, unknown>[]).map((r) => ({
    id: String(r.id),
    status: String(r.status),
    gateway: String(r.gateway),
    paisa: Number(r.paisa),
    createdAt: new Date(String(r.created_at)),
    product: String(r.product ?? "—"),
    buyer: String(r.buyer),
    email: String(r.email),
  }))
}

export async function getRecentSignups(limit = 8) {
  const result = await db.execute(sql`
    select u.id, u.name, u.email, u.created_at, (i.id is not null) as is_creator
    from "user" u left join instructors i on i."userId" = u.id
    where u.deleted_at is null
    order by u.created_at desc limit ${limit}
  `)
  return (result.rows as Record<string, unknown>[]).map((r) => ({
    id: String(r.id),
    name: String(r.name),
    email: String(r.email),
    createdAt: new Date(String(r.created_at)),
    isCreator: Boolean(r.is_creator),
  }))
}
