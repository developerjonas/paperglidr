import { and, eq } from "drizzle-orm"
import { describe, expect, it, vi } from "vitest"
import { db } from "@/drizzle/db"
import { SessionTable, UserCourseAccessTable, UserTable } from "@/drizzle/schema"
import { createProduct, createUser } from "@/test/fixtures"

// Admin user management: role changes, course access, sessions, deletion,
// and the user directory behind /admin/users.

const session = vi.hoisted(() => ({ userId: null as string | null }))
const resetRequests = vi.hoisted(() => [] as string[])
vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: async () => (session.userId ? { user: { id: session.userId } } : null),
      requestPasswordReset: async ({ body }: { body: { email: string } }) => {
        resetRequests.push(body.email)
        return { status: true }
      },
    },
  },
}))
vi.mock("next/headers", () => ({ headers: async () => new Headers(), cookies: async () => ({ get: () => undefined }) }))

const { setUserRole, grantCourseAccess, revokeCourseAccess, sendPasswordResetEmail, signOutEverywhere, deleteUserAccount } = await import("./users")
const { listUsers, getUserDetail } = await import("../db/users")

async function asAdmin() {
  const admin = await createUser("admin")
  await db.update(UserTable).set({ role: "admin" }).where(eq(UserTable.id, admin.id))
  session.userId = admin.id
  return admin
}

const roleOf = async (id: string) => (await db.query.UserTable.findFirst({ where: eq(UserTable.id, id) }))!.role

describe("admin user actions", () => {
  it("non-admins get a 404 and nothing changes", async () => {
    const user = await createUser()
    session.userId = user.id
    await expect(setUserRole(user.id, "admin")).rejects.toThrow("NEXT_HTTP_ERROR_FALLBACK;404")
    expect(await roleOf(user.id)).toBe("user")
  })

  it("makes and unmakes an admin, but never yourself", async () => {
    const admin = await asAdmin()
    const user = await createUser()
    expect(await setUserRole(user.id, "admin")).toMatchObject({ error: false })
    expect(await roleOf(user.id)).toBe("admin")
    expect(await setUserRole(user.id, "user")).toMatchObject({ error: false })
    expect(await roleOf(user.id)).toBe("user")
    expect(await setUserRole(admin.id, "user")).toMatchObject({ error: true, message: expect.stringContaining("your own role") })
    expect(await roleOf(admin.id)).toBe("admin")
  })

  it("grants and removes a course", async () => {
    await asAdmin()
    const user = await createUser()
    const { course } = await createProduct()
    const has = async () =>
      (await db.select().from(UserCourseAccessTable).where(and(eq(UserCourseAccessTable.userId, user.id), eq(UserCourseAccessTable.courseId, course.id)))).length
    expect(await grantCourseAccess(user.id, course.id)).toMatchObject({ error: false, message: "Access granted." })
    expect(await grantCourseAccess(user.id, course.id)).toMatchObject({ error: false, message: "They already have this course." })
    expect(await has()).toBe(1)
    expect((await getUserDetail(user.id))?.courses.map((c) => c.id)).toEqual([course.id])
    expect(await revokeCourseAccess(user.id, course.id)).toMatchObject({ error: false, message: "Access removed." })
    expect(await has()).toBe(0)
    expect(await grantCourseAccess(user.id, "00000000-0000-0000-0000-000000000000")).toMatchObject({ error: true, message: "Course not found." })
  })

  it("sends a reset email and signs out every device", async () => {
    await asAdmin()
    const user = await createUser()
    await db.insert(SessionTable).values([
      { userId: user.id, token: `t1-${user.id}`, expiresAt: new Date(Date.now() + 3_600_000) },
      { userId: user.id, token: `t2-${user.id}`, expiresAt: new Date(Date.now() + 3_600_000) },
    ])
    expect(await sendPasswordResetEmail(user.id)).toMatchObject({ error: false })
    expect(resetRequests).toContain(user.email)
    expect(await signOutEverywhere(user.id)).toMatchObject({ error: false, message: "Signed out of 2 session(s)." })
    expect(await db.select().from(SessionTable).where(eq(SessionTable.userId, user.id))).toHaveLength(0)
  })

  it("deletes a learner's account; refuses admins, creators with courses and a wrong confirmation", async () => {
    await asAdmin()
    const learner = await createUser()
    expect(await deleteUserAccount(learner.id, "delete it")).toMatchObject({ error: true })
    expect(await deleteUserAccount(learner.id, "DELETE")).toMatchObject({ error: false })
    const row = await db.query.UserTable.findFirst({ where: eq(UserTable.id, learner.id) })
    expect(row).toMatchObject({ name: "Deleted user", deletedAt: expect.any(Date) })
    expect(await sendPasswordResetEmail(learner.id)).toMatchObject({ error: true })

    const other = await createUser()
    await db.update(UserTable).set({ role: "admin" }).where(eq(UserTable.id, other.id))
    expect(await deleteUserAccount(other.id, "DELETE")).toMatchObject({ error: true, message: "Remove their admin role first." })

    const { creator } = await createProduct()
    const { InstructorTable } = await import("@/drizzle/schema")
    await db.insert(InstructorTable).values({ userId: creator.id, handle: `d${creator.id.slice(0, 8)}`, name: "C", bio: "b", profileImageUrl: "/x.png" })
    expect(await deleteUserAccount(creator.id, "DELETE")).toMatchObject({ error: true, message: expect.stringContaining("creator") })
  })
})

describe("user directory", () => {
  it("searches by email and filters admins and deleted accounts", async () => {
    const admin = await asAdmin()
    const user = await createUser("findme")
    const found = await listUsers({ q: user.email, filter: "all", page: 1 })
    expect(found.rows.map((r) => r.id)).toEqual([user.id])
    expect((await listUsers({ filter: "admins", page: 1 })).rows.map((r) => r.id)).toContain(admin.id)
    expect((await listUsers({ q: user.email, filter: "admins", page: 1 })).rows).toHaveLength(0)
    await deleteUserAccount(user.id, "DELETE")
    expect((await listUsers({ filter: "deleted", page: 1 })).rows.map((r) => r.id)).toContain(user.id)
  })
})
