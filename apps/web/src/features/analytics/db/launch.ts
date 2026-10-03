import "server-only"
import { sql } from "drizzle-orm"
import { db } from "@/drizzle/db"

// The launch dashboard (/admin/launch): growth, not accounting — money
// totals and fees are on /admin/revenue. Days are Nepal days.
//
// A "paid sale" is a purchase through a gateway (not a free enrollment)
// that completed, refunded ones included: it happened, and refunds are
// tracked on /admin/refunds. purchases."createdAt" is timestamptz;
// "user".created_at is a plain timestamp written in UTC.

const NEPAL = "Asia/Kathmandu"
const PAID = sql`p.gateway <> 'free' and p.status in ('completed', 'refunded')`

export type LaunchSummary = {
  signups: number
  paidSales: number
  gmvPaisa: number
  freeEnrollments: number
  checkoutsStarted: number
  buyersAmongSignups: number
  salesViaOwnLink: number
}

export type LaunchDay = {
  day: string
  signups: number
  paidSales: number
  gmvPaisa: number
  freeEnrollments: number
}

export type CreatorSales = {
  userId: string
  name: string
  handle: string | null
  liveProducts: number
  paidSales: number
  gmvPaisa: number
  salesViaOwnLink: number
  allTimeSales: number
  lastSaleAt: Date | null
}

const num = (value: unknown) => Number(value ?? 0)

export async function getLaunchSummary(days: number): Promise<LaunchSummary> {
  const since = sql`now() - make_interval(days => ${days})`
  const result = await db.execute(sql`
    select
      (select count(*) from "user" u
        where u.deleted_at is null and (u.created_at at time zone 'UTC') >= ${since}) as signups,
      (select count(*) from purchases p where ${PAID} and p."createdAt" >= ${since}) as paid_sales,
      (select coalesce(sum(p."pricePaidInPaisa"), 0) from purchases p where ${PAID} and p."createdAt" >= ${since}) as gmv_paisa,
      (select count(*) from purchases p
        where p.gateway = 'free' and p.status = 'completed' and p."createdAt" >= ${since}) as free_enrollments,
      (select count(*) from purchases p where p.gateway <> 'free' and p."createdAt" >= ${since}) as checkouts_started,
      (select count(distinct u.id) from "user" u
        join purchases p on p."userId" = u.id and ${PAID}
        where u.deleted_at is null and (u.created_at at time zone 'UTC') >= ${since}) as buyers_among_signups,
      (select count(*) from purchases p
        where ${PAID} and p."createdAt" >= ${since} and p."referredByInstructorId" is not null) as sales_via_own_link
  `)
  const row = result.rows[0] as Record<string, unknown>
  return {
    signups: num(row.signups),
    paidSales: num(row.paid_sales),
    gmvPaisa: num(row.gmv_paisa),
    freeEnrollments: num(row.free_enrollments),
    checkoutsStarted: num(row.checkouts_started),
    buyersAmongSignups: num(row.buyers_among_signups),
    salesViaOwnLink: num(row.sales_via_own_link),
  }
}

/** One row per Nepal day, newest first, including days with nothing. */
export async function getLaunchDays(days: number): Promise<LaunchDay[]> {
  const result = await db.execute(sql`
    with days as (
      select generate_series(
        (now() at time zone ${NEPAL})::date - (${days} - 1),
        (now() at time zone ${NEPAL})::date,
        interval '1 day'
      )::date as day
    ),
    signups as (
      select ((u.created_at at time zone 'UTC') at time zone ${NEPAL})::date as day, count(*) as n
      from "user" u where u.deleted_at is null group by 1
    ),
    sales as (
      select (p."createdAt" at time zone ${NEPAL})::date as day,
             count(*) filter (where ${PAID}) as paid,
             coalesce(sum(p."pricePaidInPaisa") filter (where ${PAID}), 0) as gmv,
             count(*) filter (where p.gateway = 'free' and p.status = 'completed') as free
      from purchases p group by 1
    )
    select d.day::text as day, coalesce(s.n, 0) as signups, coalesce(x.paid, 0) as paid,
           coalesce(x.gmv, 0) as gmv, coalesce(x.free, 0) as free
    from days d
    left join signups s on s.day = d.day
    left join sales x on x.day = d.day
    order by d.day desc
  `)
  return (result.rows as Record<string, unknown>[]).map((row) => ({
    day: String(row.day),
    signups: num(row.signups),
    paidSales: num(row.paid),
    gmvPaisa: num(row.gmv),
    freeEnrollments: num(row.free),
  }))
}

/**
 * Every creator with something live or ever sold: sales in the window,
 * how many came through their own ?ref= link, all-time sales and the last
 * sale. Creators with no sales are included (they're the check-in list).
 */
export async function getCreatorSales(days: number): Promise<CreatorSales[]> {
  const since = sql`now() - make_interval(days => ${days})`
  const result = await db.execute(sql`
    select u.id as user_id, coalesce(i.name, u.name) as name, i.handle,
      (select count(*) from products pr where pr.author_id = u.id and pr.status = 'public') as live_products,
      count(p.id) filter (where p."createdAt" >= ${since}) as paid_sales,
      coalesce(sum(p."pricePaidInPaisa") filter (where p."createdAt" >= ${since}), 0) as gmv,
      count(p.id) filter (where p."createdAt" >= ${since} and p."referredByInstructorId" = u.id) as via_own_link,
      count(p.id) as all_time,
      max(p."createdAt") as last_sale
    from "user" u
    left join instructors i on i."userId" = u.id
    left join products pr2 on pr2.author_id = u.id
    left join purchases p on p."productId" = pr2.id and ${PAID}
    where exists (select 1 from products pr where pr.author_id = u.id and pr.status = 'public')
       or exists (select 1 from purchases p2 join products pr3 on pr3.id = p2."productId"
                  where pr3.author_id = u.id and p2.gateway <> 'free' and p2.status in ('completed', 'refunded'))
    group by u.id, i.name, u.name, i.handle
    order by gmv desc, paid_sales desc, name asc
  `)
  return (result.rows as Record<string, unknown>[]).map((row) => ({
    userId: String(row.user_id),
    name: String(row.name),
    handle: row.handle == null ? null : String(row.handle),
    liveProducts: num(row.live_products),
    paidSales: num(row.paid_sales),
    gmvPaisa: num(row.gmv),
    salesViaOwnLink: num(row.via_own_link),
    allTimeSales: num(row.all_time),
    lastSaleAt: row.last_sale == null ? null : new Date(String(row.last_sale)),
  }))
}
