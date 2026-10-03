import { eq } from "drizzle-orm"
import { describe, expect, it, vi } from "vitest"
import { db } from "@/drizzle/db"
import { InstructorTable, ProductTable, UserTable } from "@/drizzle/schema"
import { createProduct, createUser } from "@/test/fixtures"

// Featured courses and Founding-creator badges: admin-only switches that
// reach the home page, the app's listing and the public API.

const session = vi.hoisted(() => ({ userId: null as string | null }))
vi.mock("@/lib/auth", () => ({
  auth: { api: { getSession: async () => (session.userId ? { user: { id: session.userId } } : null) } },
}))
vi.mock("next/headers", () => ({ headers: async () => new Headers(), cookies: async () => ({ get: () => undefined }) }))

const { setProductFeatured } = await import("./featured")
const { setCreatorFlag } = await import("@/features/instructors/actions/adminCreators")
const { getPublicProductListings, getPublicProductDetail } = await import("../db/products")
const { getHomeCatalog } = await import("../db/home")

async function asAdmin() {
  const admin = await createUser("admin")
  await db.update(UserTable).set({ role: "admin" }).where(eq(UserTable.id, admin.id))
  session.userId = admin.id
}

describe("featured courses", () => {
  it("only an admin can feature; others get a 404", async () => {
    const { product, creator } = await createProduct()
    session.userId = creator.id
    await expect(setProductFeatured(product.id, true)).rejects.toThrow("NEXT_HTTP_ERROR_FALLBACK;404")
    const [row] = await db.select().from(ProductTable).where(eq(ProductTable.id, product.id))
    expect(row!.featuredAt).toBeNull()
  })

  it("an admin features a live course; it lists first, flagged, and unfeaturing clears it", async () => {
    await asAdmin()
    const { product } = await createProduct()
    expect(await setProductFeatured(product.id, true)).toMatchObject({ error: false })
    const listings = await getPublicProductListings()
    expect(listings[0]).toMatchObject({ id: product.id, isFeatured: true })
    expect((await getHomeCatalog()).courses.find((c) => c.id === product.id)?.featuredAt).toBeInstanceOf(Date)

    expect(await setProductFeatured(product.id, false)).toMatchObject({ error: false })
    expect((await getPublicProductListings()).find((p) => p.id === product.id)?.isFeatured).toBe(false)
  })

  it("a private course can't be featured", async () => {
    await asAdmin()
    const { product } = await createProduct({ status: "private" })
    expect(await setProductFeatured(product.id, true)).toMatchObject({ error: true, message: "Only live courses can be featured" })
  })
})

describe("Founding creator", () => {
  it("an admin turns the badge on; it shows on courses, the home page and the API", async () => {
    const { product, creator } = await createProduct()
    const [instructor] = await db
      .insert(InstructorTable)
      .values({ userId: creator.id, handle: `f${creator.id.slice(0, 8)}`, name: "Ramesh", bio: "b", profileImageUrl: "/x.png" })
      .returning()

    session.userId = creator.id
    await expect(setCreatorFlag(instructor!.id, "isFounding", true)).rejects.toThrow("NEXT_HTTP_ERROR_FALLBACK;404")

    await asAdmin()
    expect(await setCreatorFlag(instructor!.id, "isFounding", true)).toMatchObject({ error: false })
    expect(await setCreatorFlag(instructor!.id, "isVerified", true)).toMatchObject({ error: false })

    expect((await getPublicProductDetail(product.id))?.instructor).toMatchObject({ isFounding: true, isVerified: true })
    const home = await getHomeCatalog()
    expect(home.courses.find((c) => c.id === product.id)?.instructorFounding).toBe(true)
    expect(home.instructors[0]).toMatchObject({ isFounding: true })
  })
})
