import { eq } from "drizzle-orm"
import { describe, expect, it, vi } from "vitest"
import { db } from "@/drizzle/db"
import { CourseSectionTable, LessonAssetTable, LessonTable, ProductTable, UserCourseAccessTable, UserTable } from "@/drizzle/schema"
import { createProduct, createUser } from "@/test/fixtures"

// The admin's course and product lists, and taking a live product off sale.

const session = vi.hoisted(() => ({ userId: null as string | null }))
vi.mock("@/lib/auth", () => ({
  auth: { api: { getSession: async () => (session.userId ? { user: { id: session.userId } } : null) } },
}))
vi.mock("next/headers", () => ({ headers: async () => new Headers(), cookies: async () => ({ get: () => undefined }) }))
const sent = vi.hoisted(() => [] as { to: string; subject: string }[])
vi.mock("@/services/email/resend", () => ({
  sendEmail: async (email: { to: string; subject: string }) => {
    sent.push(email)
  },
}))

const { listCourses, getCourseDetail, listProducts } = await import("./catalogue")
const { unpublishProductAsAdmin } = await import("@/features/products/actions/moderation")

async function asAdmin() {
  const admin = await createUser("admin")
  await db.update(UserTable).set({ role: "admin" }).where(eq(UserTable.id, admin.id))
  session.userId = admin.id
}

describe("admin catalogue", () => {
  it("lists a course as paid, free or not on sale, with its outline and products", async () => {
    const paid = await createProduct({ priceInRupees: 999 })
    const free = await createProduct({ priceInRupees: 0 })
    const draft = await createProduct({ status: "private" })
    const state = async (name: string) => (await listCourses({ q: name, filter: "all", page: 1 })).rows[0]?.state
    expect(await state(paid.course.name)).toBe("paid")
    expect(await state(free.course.name)).toBe("free")
    expect(await state(draft.course.name)).toBe("draft")
    expect((await listCourses({ q: free.course.name, filter: "paid", page: 1 })).rows).toHaveLength(0)

    const [section] = await db.insert(CourseSectionTable).values({ name: "Intro", order: 0, courseId: paid.course.id, status: "public" }).returning()
    const [lesson] = await db.insert(LessonTable).values({ name: "Welcome", order: 0, sectionId: section!.id, status: "preview" }).returning()
    await db.insert(LessonAssetTable).values({ lessonId: lesson!.id, type: "youtube", provider: "youtube", externalId: "dQw4w9WgXcQ" })
    const student = await createUser()
    await db.insert(UserCourseAccessTable).values({ userId: student.id, courseId: paid.course.id })

    const detail = await getCourseDetail(paid.course.id)
    expect(detail).toMatchObject({ state: "paid", students: 1, products: [{ id: paid.product.id, status: "public" }] })
    expect(detail?.sections).toEqual([
      { id: section!.id, name: "Intro", status: "public", lessons: [{ id: lesson!.id, name: "Welcome", status: "preview", assets: ["youtube:youtube"] }] },
    ])
    expect(await getCourseDetail("00000000-0000-0000-0000-000000000000")).toBeNull()
  })

  it("an admin takes a live product off sale with a reason; buyers keep access, the creator is emailed", async () => {
    const { product, course, creator } = await createProduct()
    const buyer = await createUser()
    await db.insert(UserCourseAccessTable).values({ userId: buyer.id, courseId: course.id })

    session.userId = creator.id
    await expect(unpublishProductAsAdmin(product.id, "Pirated")).rejects.toThrow("NEXT_HTTP_ERROR_FALLBACK;404")

    await asAdmin()
    expect(await unpublishProductAsAdmin(product.id, "  ")).toMatchObject({ error: true, message: "A reason is required" })
    expect(await unpublishProductAsAdmin(product.id, "Pirated content")).toMatchObject({ error: false })
    const [row] = await db.select().from(ProductTable).where(eq(ProductTable.id, product.id))
    expect(row).toMatchObject({ status: "private", reviewNote: "Pirated content", featuredAt: null })
    expect(sent.some((e) => e.to === creator.email && e.subject.includes("taken off sale"))).toBe(true)
    expect(await db.select().from(UserCourseAccessTable).where(eq(UserCourseAccessTable.userId, buyer.id))).toHaveLength(1)
    expect(await unpublishProductAsAdmin(product.id, "again")).toMatchObject({ error: true, message: "This product isn't live" })

    const listed = await listProducts({ q: product.name, filter: "private", page: 1 })
    expect(listed.rows[0]).toMatchObject({ id: product.id, reviewNote: "Pirated content", courses: 1, sales: 0 })
  })
})
