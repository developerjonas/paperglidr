import { eq } from "drizzle-orm"
import { describe, expect, it, vi } from "vitest"
import { db } from "@/drizzle/db"
import {
  AccountTable,
  CertificateTable,
  CourseReviewTable,
  CourseSectionTable,
  InstructorTable,
  LessonTable,
  PurchaseTable,
  SessionTable,
  UserCourseAccessTable,
  UserLessonCompleteTable,
  UserTable,
  VerificationTable,
  WishlistTable,
} from "@/drizzle/schema"
import { createPendingPurchase, createProduct, createUser } from "@/test/fixtures"

// Deleting your own account (App Store / Play requirement): sign-in and
// personal data go; purchase records, reviews (anonymised) and issued
// certificates stay; creators with courses go through support.

process.env.MOBILE_API_ENABLED = "true"

const session = vi.hoisted(() => ({ userId: null as string | null }))
vi.mock("@/lib/auth", () => ({
  auth: { api: { getSession: async () => (session.userId ? { user: { id: session.userId } } : null) } },
}))
vi.mock("next/headers", () => ({
  headers: async () => new Headers(),
  cookies: async () => ({ get: () => undefined, delete: () => {} }),
}))

const { deleteAccount, getAccountDeletionBlocker } = await import("./deleteAccount")
const { deleteMyAccount } = await import("../actions/deleteAccount")
const meRoute = await import("@/app/api/v1/me/route")

/** A learner who bought a course and used the site: every kind of row deletion touches. */
async function learnerWithHistory() {
  const { purchase, buyer, course, product } = await createPendingPurchase()
  await db.update(PurchaseTable).set({ status: "completed" }).where(eq(PurchaseTable.id, purchase.id))
  await db.update(UserTable).set({ username: `learner_${buyer.id.slice(0, 8)}`, image: "https://lh3.googleusercontent.com/x" }).where(eq(UserTable.id, buyer.id))
  await db.insert(SessionTable).values({ userId: buyer.id, token: `tok-${buyer.id}`, expiresAt: new Date(Date.now() + 86400000) })
  await db.insert(AccountTable).values([
    { userId: buyer.id, providerId: "credential", accountId: buyer.id, password: "hash" },
    { userId: buyer.id, providerId: "google", accountId: `google-${buyer.id}` },
  ])
  await db.insert(VerificationTable).values({ identifier: `reset-password:${buyer.id}`, value: buyer.id, expiresAt: new Date(Date.now() + 3600000) })
  await db.insert(UserCourseAccessTable).values({ userId: buyer.id, courseId: course.id })
  const [section] = await db.insert(CourseSectionTable).values({ name: "s", status: "public", order: 0, courseId: course.id }).returning()
  const [lesson] = await db.insert(LessonTable).values({ name: "l", status: "public", order: 0, sectionId: section!.id }).returning()
  await db.insert(UserLessonCompleteTable).values({ userId: buyer.id, lessonId: lesson!.id })
  await db.insert(WishlistTable).values({ userId: buyer.id, productId: product.id })
  await db.insert(CourseReviewTable).values({ userId: buyer.id, courseId: course.id, rating: 5, content: "Great" })
  await db.insert(CertificateTable).values({
    userId: buyer.id,
    courseId: course.id,
    certificateCode: `CERT-${buyer.id.slice(0, 10).toUpperCase()}`,
    userNameSnapshot: "Sita Sharma",
    courseTitleSnapshot: "Course",
    instructorNameSnapshot: "Teacher",
    courseDurationMinutesSnapshot: 60,
  })
  return { user: buyer, purchase }
}

const rows = async (userId: string) => ({
  sessions: (await db.select().from(SessionTable).where(eq(SessionTable.userId, userId))).length,
  accounts: (await db.select().from(AccountTable).where(eq(AccountTable.userId, userId))).length,
  resetLinks: (await db.select().from(VerificationTable).where(eq(VerificationTable.value, userId))).length,
  access: (await db.select().from(UserCourseAccessTable).where(eq(UserCourseAccessTable.userId, userId))).length,
  progress: (await db.select().from(UserLessonCompleteTable).where(eq(UserLessonCompleteTable.userId, userId))).length,
  wishlist: (await db.select().from(WishlistTable).where(eq(WishlistTable.userId, userId))).length,
  purchases: (await db.select().from(PurchaseTable).where(eq(PurchaseTable.userId, userId))).length,
  reviews: (await db.select().from(CourseReviewTable).where(eq(CourseReviewTable.userId, userId))).length,
  certificates: (await db.select().from(CertificateTable).where(eq(CertificateTable.userId, userId))).length,
})
const userRow = async (id: string) => (await db.select().from(UserTable).where(eq(UserTable.id, id)))[0]!

describe("deleteAccount", () => {
  it("does nothing without the typed confirmation", async () => {
    const { user } = await learnerWithHistory()
    const before = await rows(user.id)
    expect(await deleteAccount({ userId: user.id, confirmation: "delete me" })).toMatchObject({ ok: false, reason: "confirmation" })
    expect(await rows(user.id)).toEqual(before)
    expect((await userRow(user.id)).deletedAt).toBeNull()
  })

  it("removes sign-in and personal data, keeps purchases, reviews and certificates", async () => {
    const { user } = await learnerWithHistory()
    expect(await deleteAccount({ userId: user.id, confirmation: " DELETE " })).toEqual({ ok: true })

    expect(await rows(user.id)).toEqual({
      sessions: 0,
      accounts: 0,
      resetLinks: 0,
      access: 0,
      progress: 0,
      wishlist: 0,
      purchases: 1,
      reviews: 1,
      certificates: 1,
    })
    const after = await userRow(user.id)
    expect(after).toMatchObject({
      name: "Deleted user",
      email: `deleted-${user.id}@deleted.invalid`,
      username: null,
      displayUsername: null,
      image: null,
      emailVerified: false,
    })
    expect(after.deletedAt).toBeInstanceOf(Date)
    // The certificate still shows the name printed on it.
    const [cert] = await db.select().from(CertificateTable).where(eq(CertificateTable.userId, user.id))
    expect(cert!.userNameSnapshot).toBe("Sita Sharma")
  })

  it("frees the email and username for a new sign-up", async () => {
    const { user } = await learnerWithHistory()
    const { email, username } = await userRow(user.id)
    await deleteAccount({ userId: user.id, confirmation: "DELETE" })
    await expect(db.insert(UserTable).values({ name: "Again", email, username }).returning()).resolves.toHaveLength(1)
  })

  it("a deleted account can't be deleted twice", async () => {
    const { user } = await learnerWithHistory()
    await deleteAccount({ userId: user.id, confirmation: "DELETE" })
    expect(await deleteAccount({ userId: user.id, confirmation: "DELETE" })).toMatchObject({ ok: false, reason: "not_found" })
  })

  it("a creator with a course or product goes through support instead", async () => {
    const { creator } = await createProduct()
    await db.insert(InstructorTable).values({ userId: creator.id, handle: `c${creator.id.slice(0, 8)}`, name: "C", bio: "b", profileImageUrl: "/x.png" })
    expect(await getAccountDeletionBlocker(creator.id)).toMatchObject({ reason: "creator" })
    expect(await deleteAccount({ userId: creator.id, confirmation: "DELETE" })).toMatchObject({ ok: false, reason: "creator" })
    expect((await userRow(creator.id)).deletedAt).toBeNull()
  })

  it("a creator profile with nothing published is removed with the account", async () => {
    const user = await createUser("would-be-creator")
    await db.insert(InstructorTable).values({ userId: user.id, handle: `w${user.id.slice(0, 8)}`, name: "W", bio: "b", profileImageUrl: "/x.png" })
    expect(await deleteAccount({ userId: user.id, confirmation: "DELETE" })).toEqual({ ok: true })
    expect(await db.select().from(InstructorTable).where(eq(InstructorTable.userId, user.id))).toHaveLength(0)
  })

  it("an admin can't delete themselves", async () => {
    const admin = await createUser("admin")
    await db.update(UserTable).set({ role: "admin" }).where(eq(UserTable.id, admin.id))
    expect(await deleteAccount({ userId: admin.id, confirmation: "DELETE" })).toMatchObject({ ok: false, reason: "admin" })
  })
})

describe("web action and app API", () => {
  it("deleteMyAccount needs a session and deletes only the caller", async () => {
    const { user } = await learnerWithHistory()
    const other = await learnerWithHistory()
    session.userId = null
    expect(await deleteMyAccount("DELETE")).toMatchObject({ error: true })
    session.userId = user.id
    expect(await deleteMyAccount("nope")).toMatchObject({ error: true, message: "Type DELETE to confirm." })
    // Success lands on the public confirmation page.
    await expect(deleteMyAccount("DELETE")).rejects.toThrow("NEXT_REDIRECT")
    expect((await userRow(user.id)).deletedAt).toBeInstanceOf(Date)
    expect((await userRow(other.user.id)).deletedAt).toBeNull()
  })

  const del = (body: unknown) =>
    meRoute.DELETE(
      new Request("http://t/api/v1/me", { method: "DELETE", body: JSON.stringify(body), headers: { "Content-Type": "application/json" } }) as never,
      { params: Promise.resolve({}) } as never,
    )

  it("DELETE /api/v1/me: 401 signed out, 400 without confirmation, 200 and the token stops working", async () => {
    const { user } = await learnerWithHistory()
    session.userId = null
    expect((await del({ confirmation: "DELETE" })).status).toBe(401)
    session.userId = user.id
    const bad = await del({ confirmation: "yes" })
    expect(bad.status).toBe(400)
    expect(await bad.json()).toMatchObject({ message: "Type DELETE to confirm." })
    const ok = await del({ confirmation: "DELETE" })
    expect(ok.status).toBe(200)
    // Every session (the app's Bearer token is one) is gone.
    expect((await rows(user.id)).sessions).toBe(0)
  })

  it("DELETE /api/v1/me: 409 with the support message for a creator", async () => {
    const { creator } = await createProduct()
    await db.insert(InstructorTable).values({ userId: creator.id, handle: `d${creator.id.slice(0, 8)}`, name: "C", bio: "b", profileImageUrl: "/x.png" })
    session.userId = creator.id
    const res = await del({ confirmation: "DELETE" })
    expect(res.status).toBe(409)
    expect((await res.json()).message).toMatch(/support@chiyali\.com/)
  })
})
