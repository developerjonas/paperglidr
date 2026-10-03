import "server-only"
import { sql } from "drizzle-orm"
import { db } from "@/drizzle/db"

// Courses and products as the admin sees them: every one, any status.

export const CATALOGUE_PAGE_SIZE = 50
type Row = Record<string, unknown>
const rows = async (query: ReturnType<typeof sql>) => (await db.execute(query)).rows as Row[]
const like = (q?: string) => (q?.trim() ? `%${q.trim()}%` : null)

/** free = in a live product priced 0; paid = in a paid product live or in review; else draft. Same as freeTier.ts. */
const COURSE_STATE = sql`case
  when exists (select 1 from course_products cp join products p on p.id = cp."productId"
               where cp."courseId" = c.id and p.status = 'public' and p."priceInRupees" = 0) then 'free'
  when exists (select 1 from course_products cp join products p on p.id = cp."productId"
               where cp."courseId" = c.id and p.status in ('public', 'pending_review') and p."priceInRupees" > 0) then 'paid'
  else 'draft' end`

export const COURSE_FILTERS = ["all", "paid", "free", "draft"] as const
export type CourseFilter = (typeof COURSE_FILTERS)[number]

export async function listCourses({ q, filter, page }: { q?: string; filter: CourseFilter; page: number }) {
  const term = like(q)
  const result = await rows(sql`
    select * from (
      select c.id, c.name, c."createdAt" as created_at, u.id as author_id, u.name as author, ${COURSE_STATE} as state,
        (select count(*) from course_sections s where s."courseId" = c.id) as sections,
        (select count(*) from lessons l join course_sections s on s.id = l."sectionId" where s."courseId" = c.id) as lessons,
        (select count(*) from user_course_access a where a."courseId" = c.id) as students,
        (select round(avg(r.rating)::numeric, 1) from course_reviews r where r.course_id = c.id and not r.is_hidden) as rating
      from courses c join "user" u on u.id = c.author_id
      where ${term ? sql`(c.name ilike ${term} or u.name ilike ${term} or u.email ilike ${term})` : sql`true`}
    ) x
    where ${filter === "all" ? sql`true` : sql`x.state = ${filter}`}
    order by x.created_at desc
    limit ${CATALOGUE_PAGE_SIZE + 1} offset ${(page - 1) * CATALOGUE_PAGE_SIZE}
  `)
  return {
    rows: result.slice(0, CATALOGUE_PAGE_SIZE).map((r) => ({
      id: String(r.id),
      name: String(r.name),
      createdAt: new Date(String(r.created_at)),
      authorId: String(r.author_id),
      author: String(r.author),
      state: String(r.state) as "free" | "paid" | "draft",
      sections: Number(r.sections),
      lessons: Number(r.lessons),
      students: Number(r.students),
      rating: r.rating == null ? null : Number(r.rating),
    })),
    hasMore: result.length > CATALOGUE_PAGE_SIZE,
  }
}

export async function getCourseFilterCounts(): Promise<Record<CourseFilter, number>> {
  const [r] = await rows(sql`
    select count(*) as all_courses,
      count(*) filter (where state = 'paid') as paid,
      count(*) filter (where state = 'free') as free,
      count(*) filter (where state = 'draft') as draft
    from (select ${COURSE_STATE} as state from courses c) x
  `)
  return { all: Number(r!.all_courses), paid: Number(r!.paid), free: Number(r!.free), draft: Number(r!.draft) }
}

/** One course: its outline (with what each lesson holds), the products selling it, students and reviews. */
export async function getCourseDetail(courseId: string) {
  const [course] = await rows(sql`
    select c.id, c.name, c.description, c."createdAt" as created_at, c."updatedAt" as updated_at,
      u.id as author_id, u.name as author, u.email as author_email, ${COURSE_STATE} as state,
      (select count(*) from user_course_access a where a."courseId" = c.id) as students,
      (select count(*) from certificates ce where ce."courseId" = c.id and ce."revokedAt" is null) as certificates,
      (select count(*) from course_reviews r where r.course_id = c.id and not r.is_hidden) as reviews,
      (select round(avg(r.rating)::numeric, 1) from course_reviews r where r.course_id = c.id and not r.is_hidden) as rating
    from courses c join "user" u on u.id = c.author_id where c.id = ${courseId}
  `)
  if (course == null) return null

  const [lessons, products, recentStudents] = await Promise.all([
    rows(sql`
      select s.id as section_id, s.name as section, s.status as section_status, s."order" as section_order,
        l.id, l.name, l.status, l."order",
        coalesce((select string_agg(distinct a.provider::text || ':' || a.type::text, ',') from lesson_assets a where a."lessonId" = l.id), '') as assets
      from course_sections s left join lessons l on l."sectionId" = s.id
      where s."courseId" = ${courseId}
      order by s."order", s."createdAt", l."order", l."createdAt"
    `),
    rows(sql`
      select p.id, p.name, p.status, p."priceInRupees" as price, p.featured_at,
        (select count(*) from purchases pu where pu."productId" = p.id and pu.status = 'completed') as sales
      from course_products cp join products p on p.id = cp."productId"
      where cp."courseId" = ${courseId} order by p."createdAt"
    `),
    rows(sql`
      select u.id, u.name, a."createdAt" as since from user_course_access a join "user" u on u.id = a."userId"
      where a."courseId" = ${courseId} order by a."createdAt" desc limit 10
    `),
  ])

  const sections: { id: string; name: string; status: string; lessons: { id: string; name: string; status: string; assets: string[] }[] }[] = []
  for (const r of lessons) {
    let section = sections.find((s) => s.id === r.section_id)
    if (section == null) {
      section = { id: String(r.section_id), name: String(r.section), status: String(r.section_status), lessons: [] }
      sections.push(section)
    }
    if (r.id != null) {
      section.lessons.push({ id: String(r.id), name: String(r.name), status: String(r.status), assets: String(r.assets).split(",").filter(Boolean) })
    }
  }

  return {
    id: String(course.id),
    name: String(course.name),
    description: String(course.description),
    createdAt: new Date(String(course.created_at)),
    updatedAt: new Date(String(course.updated_at)),
    authorId: String(course.author_id),
    author: String(course.author),
    authorEmail: String(course.author_email),
    state: String(course.state) as "free" | "paid" | "draft",
    students: Number(course.students),
    certificates: Number(course.certificates),
    reviews: Number(course.reviews),
    rating: course.rating == null ? null : Number(course.rating),
    sections,
    products: products.map((p) => ({
      id: String(p.id),
      name: String(p.name),
      status: String(p.status),
      priceInRupees: Number(p.price),
      featured: p.featured_at != null,
      sales: Number(p.sales),
    })),
    recentStudents: recentStudents.map((s) => ({ id: String(s.id), name: String(s.name), since: new Date(String(s.since)) })),
  }
}

export const PRODUCT_FILTERS = ["all", "public", "pending_review", "private"] as const
export type ProductFilter = (typeof PRODUCT_FILTERS)[number]

export async function listProducts({ q, filter, page }: { q?: string; filter: ProductFilter; page: number }) {
  const term = like(q)
  const result = await rows(sql`
    select p.id, p.name, p.status, p."priceInRupees" as price, p.featured_at, p."createdAt" as created_at, p.review_note,
      u.id as author_id, u.name as author, cat.name as category,
      (select count(*) from course_products cp where cp."productId" = p.id) as courses,
      (select count(*) from purchases pu where pu."productId" = p.id and pu.status = 'completed') as sales,
      (select coalesce(sum(pu."pricePaidInPaisa"), 0) from purchases pu where pu."productId" = p.id and pu.status = 'completed') as gross
    from products p join "user" u on u.id = p.author_id left join categories cat on cat.id = p.category_id
    where ${filter === "all" ? sql`true` : sql`p.status = ${filter}`}
      and ${term ? sql`(p.name ilike ${term} or u.name ilike ${term} or u.email ilike ${term})` : sql`true`}
    order by p.featured_at desc nulls last, p."createdAt" desc
    limit ${CATALOGUE_PAGE_SIZE + 1} offset ${(page - 1) * CATALOGUE_PAGE_SIZE}
  `)
  return {
    rows: result.slice(0, CATALOGUE_PAGE_SIZE).map((r) => ({
      id: String(r.id),
      name: String(r.name),
      status: String(r.status),
      priceInRupees: Number(r.price),
      featured: r.featured_at != null,
      createdAt: new Date(String(r.created_at)),
      reviewNote: r.review_note == null ? null : String(r.review_note),
      authorId: String(r.author_id),
      author: String(r.author),
      category: r.category == null ? null : String(r.category),
      courses: Number(r.courses),
      sales: Number(r.sales),
      grossPaisa: Number(r.gross),
    })),
    hasMore: result.length > CATALOGUE_PAGE_SIZE,
  }
}

export async function getProductFilterCounts(): Promise<Record<ProductFilter, number>> {
  const [r] = await rows(sql`
    select count(*) as all_products,
      count(*) filter (where status = 'public') as public,
      count(*) filter (where status = 'pending_review') as pending_review,
      count(*) filter (where status = 'private') as private
    from products
  `)
  return { all: Number(r!.all_products), public: Number(r!.public), pending_review: Number(r!.pending_review), private: Number(r!.private) }
}
