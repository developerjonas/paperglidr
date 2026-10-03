import { eq } from "drizzle-orm"
import { describe, expect, it, vi } from "vitest"
import { db } from "@/drizzle/db"
import { InstructorTable } from "@/drizzle/schema"
import { CREATOR_TERMS_VERSION } from "@/config/company"
import { createUser } from "@/test/fixtures"

// Creators accept the Creator Terms (and that they own their content),
// once per version; the acceptance is recorded and required to publish.

const session = vi.hoisted(() => ({ userId: null as string | null }))
vi.mock("@/lib/auth", () => ({
  auth: { api: { getSession: async () => (session.userId ? { user: { id: session.userId } } : null) } },
}))
vi.mock("next/headers", () => ({ headers: async () => new Headers(), cookies: async () => ({ get: () => undefined }) }))

const { saveInstructorProfile } = await import("./instructors")
const { canPublishProduct } = await import("@/features/products/lib/canPublishProduct")

const profile = (handle: string, accept?: boolean) => ({
  handle,
  name: "Sita Sharma",
  bio: "Loksewa teacher from Pokhara with years of classroom experience.",
  profileImageUrl: "/x.png",
  ...(accept === undefined ? {} : { acceptCreatorTerms: accept }),
})
const handle = () => `t${crypto.randomUUID().replaceAll("-", "").slice(0, 12)}`
const instructorOf = async (userId: string) =>
  (await db.select().from(InstructorTable).where(eq(InstructorTable.userId, userId)))[0]

describe("Creator Terms acceptance", () => {
  it("a new creator can't save a profile without accepting", async () => {
    const user = await createUser("creator")
    session.userId = user.id
    expect(await saveInstructorProfile(profile(handle()))).toMatchObject({ error: true, message: expect.stringContaining("Creator Terms") })
    expect(await saveInstructorProfile(profile(handle(), false))).toMatchObject({ error: true })
    expect(await instructorOf(user.id)).toBeUndefined()
  })

  it("accepting records when and which version", async () => {
    const user = await createUser("creator")
    session.userId = user.id
    const before = Date.now()
    expect(await saveInstructorProfile(profile(handle(), true))).toMatchObject({ error: false })
    const row = await instructorOf(user.id)
    expect(row?.creatorTermsVersion).toBe(CREATOR_TERMS_VERSION)
    expect(row?.creatorTermsAcceptedAt?.getTime()).toBeGreaterThanOrEqual(before - 1000)
  })

  it("later edits don't ask again, and don't move the acceptance date", async () => {
    const user = await createUser("creator")
    session.userId = user.id
    const h = handle()
    await saveInstructorProfile(profile(h, true))
    const accepted = (await instructorOf(user.id))!.creatorTermsAcceptedAt
    expect(await saveInstructorProfile({ ...profile(h), name: "Sita S." })).toMatchObject({ error: false })
    const row = await instructorOf(user.id)
    expect(row?.name).toBe("Sita S.")
    expect(row?.creatorTermsAcceptedAt).toEqual(accepted)
  })

  it("a creator who accepted an older version must accept again", async () => {
    const user = await createUser("creator")
    session.userId = user.id
    const h = handle()
    await saveInstructorProfile(profile(h, true))
    await db.update(InstructorTable).set({ creatorTermsVersion: "2000-01-01" }).where(eq(InstructorTable.userId, user.id))
    expect(await saveInstructorProfile(profile(h))).toMatchObject({ error: true })
    expect(await saveInstructorProfile(profile(h, true))).toMatchObject({ error: false })
    expect((await instructorOf(user.id))?.creatorTermsVersion).toBe(CREATOR_TERMS_VERSION)
  })

  it("publishing is refused until the terms are accepted", async () => {
    const user = await createUser("creator")
    await db.insert(InstructorTable).values({ userId: user.id, handle: handle(), name: "N", bio: "b", profileImageUrl: "/x.png" })
    const check = await canPublishProduct({ description: "x".repeat(120), courseIds: [], authorId: user.id, role: "user" })
    expect(check).toMatchObject({ canPublish: false, reasons: expect.arrayContaining([expect.stringContaining("Creator Terms")]) })
  })
})
