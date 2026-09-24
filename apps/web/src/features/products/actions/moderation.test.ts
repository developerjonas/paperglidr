import { eq } from "drizzle-orm"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { db } from "@/drizzle/db"
import {
  CourseSectionTable,
  CourseTable,
  InstructorTable,
  LessonAssetTable,
  LessonTable,
  ProductTable,
  UserTable,
} from "@/drizzle/schema"
import { createUser } from "@/test/fixtures"

// Task 18: "Publish" from a creator lands in pending_review; only an admin
// decision makes a product public or sends it back with a reason.

const session = vi.hoisted(() => ({ userId: null as string | null }))
vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: async () => (session.userId ? { user: { id: session.userId } } : null),
    },
  },
}))
vi.mock("next/headers", () => ({
  headers: async () => new Headers(),
  cookies: async () => ({ get: () => undefined }),
}))
const sent = vi.hoisted(() => [] as { to: string; subject: string }[])
vi.mock("@/services/email/resend", () => ({
  sendEmail: async (email: { to: string; subject: string }) => {
    sent.push(email)
  },
}))

const { createProduct, updateProduct } = await import("./products")
const { approveProduct, rejectProduct } = await import("../lib/moderation")

const DESCRIPTION = "A complete Loksewa preparation course. ".repeat(4)

/** A creator (verified, cap 3) with one course that has a preview video. */
async function creatorWithPublishableCourse() {
  const creator = await createUser("creator")
  await db.insert(InstructorTable).values({
    userId: creator.id,
    handle: `h${crypto.randomUUID().replaceAll("-", "").slice(0, 20)}`,
    name: "Creator",
    bio: "bio",
    profileImageUrl: "/x.png",
    phoneVerifiedAt: new Date(),
  })
  const [course] = await db.insert(CourseTable).values({ name: "C", description: "d", authorId: creator.id }).returning()
  const [section] = await db
    .insert(CourseSectionTable)
    .values({ name: "s", order: 0, courseId: course!.id, status: "public" })
    .returning()
  const [lesson] = await db
    .insert(LessonTable)
    .values({ name: "intro", order: 0, status: "preview", sectionId: section!.id })
    .returning()
  await db.insert(LessonAssetTable).values({
    lessonId: lesson!.id,
    type: "youtube",
    provider: "youtube",
    role: "primary",
    externalId: "dQw4w9WgXcQ",
    status: "ready",
  })
  return { creator, course: course! }
}

const input = (courseId: string, status: "private" | "public") => ({
  name: `Product ${crypto.randomUUID()}`,
  priceInRupees: 999,
  description: DESCRIPTION,
  imageUrl: "/x.png",
  status,
  categoryId: null,
  tagIds: [],
  courseIds: [courseId],
})

// createProduct/updateProduct end in redirect(), which throws NEXT_REDIRECT.
async function expectRedirect(promise: Promise<unknown>) {
  await expect(promise).rejects.toMatchObject({ digest: expect.stringContaining("NEXT_REDIRECT") })
}

const productsOf = (authorId: string) => db.select().from(ProductTable).where(eq(ProductTable.authorId, authorId))

beforeEach(() => {
  sent.length = 0
})

describe("moderation gate", () => {
  it("a creator's new product lands in pending_review, not public", async () => {
    const { creator, course } = await creatorWithPublishableCourse()
    session.userId = creator.id
    await expectRedirect(createProduct(input(course.id, "public")))
    const [product] = await productsOf(creator.id)
    expect(product!.status).toBe("pending_review")
    expect(product!.submittedForReviewAt).not.toBeNull()
  })

  it("a creator can't bypass review by sending status 'pending_review' or 'public' in other shapes", async () => {
    const { creator, course } = await creatorWithPublishableCourse()
    session.userId = creator.id
    const result = await createProduct({ ...input(course.id, "public"), status: "pending_review" as never })
    expect(result).toMatchObject({ error: true })
    expect(await productsOf(creator.id)).toHaveLength(0)
  })

  it("approve makes it public and emails the creator; a second decision is refused", async () => {
    const { creator, course } = await creatorWithPublishableCourse()
    const admin = await createUser("admin")
    session.userId = creator.id
    await expectRedirect(createProduct(input(course.id, "public")))
    const [product] = await productsOf(creator.id)

    expect((await approveProduct({ productId: product!.id, adminId: admin.id })).outcome).toBe("approved")
    expect((await rejectProduct({ productId: product!.id, adminId: admin.id, reason: "x" })).outcome).toBe("not_pending")
    const [after] = await productsOf(creator.id)
    expect(after).toMatchObject({ status: "public", reviewedBy: admin.id, reviewNote: null })
    expect(sent.map(e => e.to)).toEqual([creator.email])

    // Editing a live product keeps it live (no re-review on every save).
    await expectRedirect(updateProduct(product!.id, input(course.id, "public")))
    expect((await productsOf(creator.id))[0]!.status).toBe("public")
  })

  it("reject sends it back to private with the reason; resubmitting clears it", async () => {
    const { creator, course } = await creatorWithPublishableCourse()
    const admin = await createUser("admin")
    session.userId = creator.id
    await expectRedirect(createProduct(input(course.id, "public")))
    const [product] = await productsOf(creator.id)

    await rejectProduct({ productId: product!.id, adminId: admin.id, reason: "Thumbnail is someone else's logo" })
    expect((await productsOf(creator.id))[0]).toMatchObject({
      status: "private",
      reviewNote: "Thumbnail is someone else's logo",
    })
    expect(sent).toHaveLength(1)

    await expectRedirect(updateProduct(product!.id, input(course.id, "public")))
    expect((await productsOf(creator.id))[0]).toMatchObject({ status: "pending_review", reviewNote: null })
  })

  it("an admin's publish goes live directly", async () => {
    const { creator, course } = await creatorWithPublishableCourse()
    await db.update(UserTable).set({ role: "admin" }).where(eq(UserTable.id, creator.id))
    session.userId = creator.id
    await expectRedirect(createProduct(input(course.id, "public")))
    expect((await productsOf(creator.id))[0]!.status).toBe("public")
  })

  it("products waiting for review count toward the live-product cap", async () => {
    const { creator, course } = await creatorWithPublishableCourse()
    session.userId = creator.id
    for (let i = 0; i < 3; i++) await expectRedirect(createProduct(input(course.id, "public")))
    const fourth = await createProduct(input(course.id, "public"))
    expect(fourth).toMatchObject({ error: true, message: expect.stringContaining("limit of 3") })
  })
})
