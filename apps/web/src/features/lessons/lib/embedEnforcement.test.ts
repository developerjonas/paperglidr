import { eq } from "drizzle-orm"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { db } from "@/drizzle/db"
import {
  CourseProductTable,
  CourseSectionTable,
  LessonAssetTable,
  LessonTable,
  ProductTable,
  UserTable,
} from "@/drizzle/schema"
import { createProduct, createUser } from "@/test/fixtures"

// Free-tier lessons (previews, and every lesson of a course in a free
// public product) take a YouTube/Vimeo link, never uploaded video; paid
// lessons take uploaded video, never a public link. Enforced on every write
// path: setting an embed, uploading, changing a lesson's status or course,
// and saving or approving a product.

const session = vi.hoisted(() => ({ userId: null as string | null }))
vi.mock("@/lib/auth", () => ({
  auth: { api: { getSession: async () => (session.userId ? { user: { id: session.userId } } : null) } },
}))
vi.mock("next/headers", () => ({ headers: async () => new Headers(), cookies: async () => ({ get: () => undefined }) }))
vi.mock("@/services/email/resend", () => ({ sendEmail: async () => {} }))
// R2 is never reached for real: uploads are signed URLs, and the object
// checks read back what the "browser" uploaded.
const r2 = vi.hoisted(() => ({ deleted: [] as string[] }))
vi.mock("@/services/storage/r2", () => ({
  buildStorageKey: ({ lessonId, fileName }: { lessonId: string; fileName: string }) => `lessons/${lessonId}/${fileName}`,
  getUploadUrl: async () => "https://upload.test/signed",
  headObject: async () => ({ contentLength: 1000, contentType: "video/mp4" }),
  readObjectPrefix: async () => new Uint8Array([0, 0, 0, 0x18, 0x66, 0x74, 0x79, 0x70]),
  deleteObject: async (key: string) => void r2.deleted.push(key),
}))

const { setLessonEmbedVideo, requestLessonAssetUploadUrl, confirmLessonAssetUpload } = await import(
  "../actions/lessonAssets"
)
const { updateLesson } = await import("../actions/lessons")
const products = await import("@/features/products/actions/products")
const { approveProduct } = await import("@/features/products/lib/moderation")

const YT = "https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=42s&si=track"
const DESCRIPTION = "A complete Loksewa preparation course with notes and practice. ".repeat(3)

let creatorId: string
let courseId: string
let sectionId: string

async function lesson(status: "preview" | "public" | "private", inSection = sectionId) {
  return (await db.insert(LessonTable).values({ name: `L ${status}`, order: 0, status, sectionId: inSection }).returning())[0]!
}
async function section(ofCourse: string) {
  return (await db.insert(CourseSectionTable).values({ name: "s", order: 0, courseId: ofCourse, status: "public" }).returning())[0]!
}
const assetsOf = (lessonId: string) => db.select().from(LessonAssetTable).where(eq(LessonAssetTable.lessonId, lessonId))
async function hostedVideo(lessonId: string, status: "ready" | "pending" = "ready") {
  return (
    await db
      .insert(LessonAssetTable)
      .values({ lessonId, type: "video_file", provider: "r2", role: "primary", status, storageKey: `lessons/${lessonId}/v.mp4`, mimeType: "video/mp4", fileSizeBytes: 1000 })
      .returning()
  )[0]!
}
async function embed(lessonId: string) {
  await db.insert(LessonAssetTable).values({ lessonId, type: "youtube", provider: "youtube", role: "primary", status: "ready", externalId: "dQw4w9WgXcQ" })
}
async function makeFree(ofCourse: string) {
  const [free] = await db
    .insert(ProductTable)
    .values({ name: "Free", description: "d", imageUrl: "/x.png", priceInRupees: 0, status: "public", authorId: creatorId })
    .returning()
  await db.insert(CourseProductTable).values({ courseId: ofCourse, productId: free!.id })
  return free!
}
const mp4Upload = (lessonId: string) => ({
  lessonId,
  fileName: "v.mp4",
  mimeType: "video/mp4",
  fileSizeBytes: 1000,
  role: "primary" as const,
  downloadable: false,
  durationSeconds: 60,
})

beforeEach(async () => {
  const { creator, course } = await createProduct({ priceInRupees: 999 })
  creatorId = creator.id
  courseId = course.id
  session.userId = creator.id
  sectionId = (await section(course.id)).id
})

describe("setLessonEmbedVideo", () => {
  it("a preview takes a YouTube link, stored normalised with its start time", async () => {
    const preview = await lesson("preview")
    expect(await setLessonEmbedVideo(preview.id, YT)).toMatchObject({ error: false })
    const [asset] = await assetsOf(preview.id)
    expect(asset).toMatchObject({ provider: "youtube", type: "youtube", externalId: "dQw4w9WgXcQ", startSeconds: 42, status: "ready" })
  })

  it("takes an unlisted Vimeo link and replaces the previous video", async () => {
    const preview = await lesson("preview")
    await setLessonEmbedVideo(preview.id, YT)
    expect(await setLessonEmbedVideo(preview.id, "https://vimeo.com/76979871/abc123def0#t=12")).toMatchObject({ error: false })
    const assets = await assetsOf(preview.id)
    expect(assets).toHaveLength(1)
    expect(assets[0]).toMatchObject({ provider: "vimeo", externalId: "76979871:abc123def0", startSeconds: 12 })
  })

  it("any lesson of a free course takes a link", async () => {
    await makeFree(courseId)
    const regular = await lesson("public")
    expect(await setLessonEmbedVideo(regular.id, YT)).toMatchObject({ error: false })
  })

  it("a paid lesson can't — the link would be public", async () => {
    for (const status of ["public", "private"] as const) {
      const paid = await lesson(status)
      expect(await setLessonEmbedVideo(paid.id, YT)).toMatchObject({ error: true, message: expect.stringContaining("Paid lessons") })
      expect(await assetsOf(paid.id)).toHaveLength(0)
    }
  })

  it.each(["javascript:alert(1)//youtu.be/dQw4w9WgXcQ", "data:text/html,hi", "https://evil.example/watch?v=dQw4w9WgXcQ", "https://vimeo.com/someone"])(
    "rejects %j",
    async url => {
      const preview = await lesson("preview")
      expect(await setLessonEmbedVideo(preview.id, url)).toMatchObject({ error: true })
      expect(await assetsOf(preview.id)).toHaveLength(0)
    },
  )

  it("another creator can't set a video on your lesson", async () => {
    const preview = await lesson("preview")
    session.userId = (await createProduct()).creator.id
    expect(await setLessonEmbedVideo(preview.id, YT)).toMatchObject({ error: true })
    expect(await assetsOf(preview.id)).toHaveLength(0)
  })
})

describe("uploads", () => {
  it("a preview can't get an uploaded video", async () => {
    const preview = await lesson("preview")
    expect(await requestLessonAssetUploadUrl(mp4Upload(preview.id))).toMatchObject({
      error: true,
      message: "Preview lessons need a YouTube or Vimeo link.",
    })
    expect(await assetsOf(preview.id)).toHaveLength(0)
  })

  it("nor can a lesson of a free course", async () => {
    await makeFree(courseId)
    const regular = await lesson("public")
    expect(await requestLessonAssetUploadUrl(mp4Upload(regular.id))).toMatchObject({
      error: true,
      message: expect.stringContaining("free course"),
    })
  })

  it("a free-tier lesson still takes PDFs and image attachments", async () => {
    const preview = await lesson("preview")
    const pdf = { ...mp4Upload(preview.id), fileName: "notes.pdf", mimeType: "application/pdf" }
    expect(await requestLessonAssetUploadUrl(pdf)).toMatchObject({ error: false })
    const image = { ...mp4Upload(preview.id), fileName: "a.png", mimeType: "image/png", role: "attachment" as const }
    expect(await requestLessonAssetUploadUrl(image)).toMatchObject({ error: false })
  })

  it("a paid lesson takes an uploaded video", async () => {
    const paid = await lesson("public")
    const requested = await requestLessonAssetUploadUrl(mp4Upload(paid.id))
    expect(requested).toMatchObject({ error: false })
    expect(await confirmLessonAssetUpload((requested as { assetId: string }).assetId, paid.id)).toMatchObject({ error: false })
  })

  it("an upload that finishes after the lesson became free-tier is refused and removed", async () => {
    const paid = await lesson("public")
    const pending = await hostedVideo(paid.id, "pending")
    await db.update(LessonTable).set({ status: "preview" }).where(eq(LessonTable.id, paid.id))
    expect(await confirmLessonAssetUpload(pending.id, paid.id)).toMatchObject({ error: true, message: expect.stringContaining("Preview lessons") })
    expect(await assetsOf(paid.id)).toHaveLength(0)
    expect(r2.deleted).toContain(pending.storageKey)
  })
})

describe("updateLesson", () => {
  const save = (id: string, status: "preview" | "public" | "private", inSection = sectionId) =>
    updateLesson(id, { name: "l", status, description: null, sectionId: inSection })
  const statusOf = async (id: string) => (await db.select().from(LessonTable).where(eq(LessonTable.id, id)))[0]!

  it("a lesson with uploaded video can't become a preview", async () => {
    const paid = await lesson("public")
    await hostedVideo(paid.id)
    expect(await save(paid.id, "preview")).toMatchObject({ error: true, message: expect.stringContaining("Preview lessons need a YouTube or Vimeo link.") })
    expect((await statusOf(paid.id)).status).toBe("public")
  })

  it("a lesson with a link can't become paid", async () => {
    const preview = await lesson("preview")
    await embed(preview.id)
    expect(await save(preview.id, "public")).toMatchObject({ error: true, message: expect.stringContaining("Paid lessons") })
    expect((await statusOf(preview.id)).status).toBe("preview")
  })

  it("…unless its course is free", async () => {
    await makeFree(courseId)
    const preview = await lesson("preview")
    await embed(preview.id)
    expect(await save(preview.id, "public")).toMatchObject({ error: false })
  })

  it("a lesson with uploaded video can't move into a free course", async () => {
    const { course: freeCourse } = await createProduct({ priceInRupees: 0 })
    await db.update(UserTable).set({ role: "admin" }).where(eq(UserTable.id, creatorId)) // may use any section
    const freeSection = await section(freeCourse.id)
    const paid = await lesson("public")
    await hostedVideo(paid.id)
    expect(await save(paid.id, "public", freeSection.id)).toMatchObject({ error: true, message: expect.stringContaining("free course") })
    expect((await statusOf(paid.id)).sectionId).toBe(sectionId)
  })
})

describe("products", () => {
  beforeEach(async () => {
    // Admin: no live-product cap and no review queue, so "public" is live.
    await db.update(UserTable).set({ role: "admin" }).where(eq(UserTable.id, creatorId))
    const intro = await lesson("preview")
    await embed(intro.id)
  })
  const input = (priceInRupees: number, status: "public" | "private", courseIds = [courseId]) => ({
    name: `Product ${crypto.randomUUID()}`,
    priceInRupees,
    description: DESCRIPTION,
    imageUrl: "/x.png",
    status,
    categoryId: null,
    tagIds: [],
    courseIds,
  })
  const redirected = (promise: Promise<unknown>) => expect(promise).rejects.toThrow("NEXT_REDIRECT")

  it("a course with uploaded video can't be published free", async () => {
    const paid = await lesson("public")
    await hostedVideo(paid.id)
    expect(await products.createProduct(input(0, "public"))).toMatchObject({
      error: true,
      message: expect.stringContaining('"L public"'),
    })
  })

  it("…but can be published paid, or saved free as a private draft", async () => {
    await hostedVideo((await lesson("public")).id)
    await redirected(products.createProduct(input(500, "public")))
    await redirected(products.createProduct(input(0, "private")))
  })

  it("a paid product can't be switched to free while its course has uploaded video", async () => {
    await hostedVideo((await lesson("public")).id)
    const { product } = await createProduct({ priceInRupees: 999 })
    await db.delete(CourseProductTable).where(eq(CourseProductTable.productId, product.id))
    await db.insert(CourseProductTable).values({ productId: product.id, courseId })
    expect(await products.updateProduct(product.id, input(0, "public"))).toMatchObject({ error: true })
    const [after] = await db.select().from(ProductTable).where(eq(ProductTable.id, product.id))
    expect(after!.priceInRupees).toBe(999)
  })

  it("a live free product can't turn paid while its lessons use links", async () => {
    const free = await makeFree(courseId)
    await embed((await lesson("public")).id)
    expect(await products.updateProduct(free.id, input(500, "public"))).toMatchObject({
      error: true,
      message: expect.stringContaining("Paid lessons can't use"),
    })
    // Unpublishing is always allowed (the links just stop playing).
    await redirected(products.updateProduct(free.id, input(0, "private")))
  })

  it("approval re-checks: a lesson got uploaded video while waiting", async () => {
    const [pending] = await db
      .insert(ProductTable)
      .values({ name: "P", description: DESCRIPTION, imageUrl: "/x.png", priceInRupees: 0, status: "pending_review", authorId: creatorId })
      .returning()
    await db.insert(CourseProductTable).values({ productId: pending!.id, courseId })
    await hostedVideo((await lesson("public")).id)
    const admin = await createUser("admin")
    expect(await approveProduct({ productId: pending!.id, adminId: admin.id })).toMatchObject({ outcome: "blocked" })
    const [after] = await db.select().from(ProductTable).where(eq(ProductTable.id, pending!.id))
    expect(after!.status).toBe("pending_review")
  })
})
