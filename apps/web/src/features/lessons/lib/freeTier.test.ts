import { describe, expect, it, vi } from "vitest"
import { db } from "@/drizzle/db"
import {
  CourseProductTable,
  CourseSectionTable,
  LessonAssetTable,
  LessonTable,
  ProductTable,
  UserCourseAccessTable,
} from "@/drizzle/schema"
import { createProduct, createUser } from "@/test/fixtures"

// Free-tier lessons (previews, and every lesson of a course in a free public
// product) never get Chiyali-hosted video (R2 MP4, Bunny) — nor does anyone
// without real access to the course. PDFs and images keep the normal rules.

process.env.MOBILE_API_ENABLED = "true"
process.env.BUNNY_STREAM_LIBRARY_ID = "test-library"
process.env.BUNNY_STREAM_TOKEN_AUTH_KEY = "test-token-key"

const session = vi.hoisted(() => ({ userId: null as string | null }))
vi.mock("@/lib/auth", () => ({
  auth: { api: { getSession: async () => (session.userId ? { user: { id: session.userId } } : null) } },
}))
vi.mock("next/headers", () => ({ headers: async () => new Headers(), cookies: async () => ({ get: () => undefined }) }))

const { GET: deliver } = await import("@/app/api/lessons/[lessonId]/assets/[assetId]/deliver/route")
const { GET: lessonRoute } = await import("@/app/api/v1/lessons/[lessonId]/route")

type Status = "public" | "preview"

/** A course (in the given product) with one lesson carrying every kind of asset. */
async function lessonWithAssets(courseId: string, status: Status) {
  const [section] = await db
    .insert(CourseSectionTable)
    .values({ name: "Section", status: "public", order: 0, courseId })
    .returning()
  const [lesson] = await db
    .insert(LessonTable)
    .values({ name: `Lesson ${status}`, status, order: 0, sectionId: section!.id })
    .returning()
  const insert = (values: Partial<typeof LessonAssetTable.$inferInsert>) =>
    db
      .insert(LessonAssetTable)
      .values({ lessonId: lesson!.id, status: "ready", role: "primary", ...values } as typeof LessonAssetTable.$inferInsert)
      .returning()
      .then(rows => rows[0]!)
  return {
    lessonId: lesson!.id,
    r2Video: await insert({ type: "video_file", provider: "r2", storageKey: "lessons/secret-video-key.mp4", fileName: "v.mp4" }),
    bunnyVideo: await insert({ type: "video_file", provider: "bunny", externalId: "bunny-video-guid", order: 1 }),
    pdf: await insert({ type: "pdf", provider: "r2", role: "attachment", storageKey: "lessons/worksheet.pdf", fileName: "w.pdf", downloadable: true, order: 2 }),
  }
}

async function enroll(userId: string, courseId: string) {
  await db.insert(UserCourseAccessTable).values({ userId, courseId })
}

async function get(lessonId: string, assetId: string, as: string | null) {
  session.userId = as
  const res = await deliver(new Request("http://t") as never, { params: Promise.resolve({ lessonId, assetId }) })
  return { status: res.status, body: (await res.json()) as Record<string, unknown> }
}

async function getLesson(lessonId: string, as: string | null) {
  session.userId = as
  const res = await lessonRoute(new Request("http://t"), { params: Promise.resolve({ lessonId }) })
  return { status: res.status, text: await res.text() }
}

const NO_HOSTED_LEAK = /secret-video-key|bunny-video-guid|mediadelivery|X-Amz-Signature/

describe("hosted video delivery", () => {
  it("a paid lesson: an enrolled buyer gets hosted video; a non-buyer is refused", async () => {
    const { course } = await createProduct({ priceInRupees: 999 })
    const lesson = await lessonWithAssets(course.id, "public")
    const buyer = await createUser("buyer")
    await enroll(buyer.id, course.id)
    const stranger = await createUser("stranger")

    const r2 = await get(lesson.lessonId, lesson.r2Video.id, buyer.id)
    expect(r2.status).toBe(200)
    expect(r2.body.type).toBe("inline")
    expect((await get(lesson.lessonId, lesson.bunnyVideo.id, buyer.id)).body.type).toBe("bunny_embed")
    expect((await get(lesson.lessonId, lesson.r2Video.id, stranger.id)).status).toBe(403)
  })

  it("a preview lesson: nobody gets hosted video — signed out, enrolled, not even the author", async () => {
    const { course, creator } = await createProduct({ priceInRupees: 999 })
    const lesson = await lessonWithAssets(course.id, "preview")
    const buyer = await createUser("buyer")
    await enroll(buyer.id, course.id)

    for (const viewer of [null, buyer.id, creator.id]) {
      for (const asset of [lesson.r2Video, lesson.bunnyVideo]) {
        const res = await get(lesson.lessonId, asset.id, viewer)
        expect(res.status).toBe(404)
        expect(JSON.stringify(res.body)).not.toMatch(NO_HOSTED_LEAK)
      }
    }
  })

  it("a preview lesson's PDF attachment still opens for anyone", async () => {
    const { course } = await createProduct({ priceInRupees: 999 })
    const lesson = await lessonWithAssets(course.id, "preview")
    const res = await get(lesson.lessonId, lesson.pdf.id, null)
    expect(res.status).toBe(200)
    expect(res.body.type).toBe("download")
  })

  it("a free course: no hosted video, even for an enrolled student", async () => {
    const { course } = await createProduct({ priceInRupees: 0 })
    const lesson = await lessonWithAssets(course.id, "public")
    const student = await createUser("student")
    await enroll(student.id, course.id)
    expect((await get(lesson.lessonId, lesson.r2Video.id, student.id)).status).toBe(404)
    expect((await get(lesson.lessonId, lesson.bunnyVideo.id, student.id)).status).toBe(404)
    expect((await get(lesson.lessonId, lesson.pdf.id, student.id)).status).toBe(200)
  })

  it("a course in both a free and a paid product counts as free", async () => {
    const { course, creator } = await createProduct({ priceInRupees: 999 })
    const [freeProduct] = await db
      .insert(ProductTable)
      .values({ name: "Free bundle", description: "d", imageUrl: "/x.png", priceInRupees: 0, status: "public", authorId: creator.id })
      .returning()
    await db.insert(CourseProductTable).values({ courseId: course.id, productId: freeProduct!.id })
    const lesson = await lessonWithAssets(course.id, "public")
    const buyer = await createUser("buyer")
    await enroll(buyer.id, course.id)
    expect((await get(lesson.lessonId, lesson.r2Video.id, buyer.id)).status).toBe(404)
  })

  it("a free product that isn't public doesn't make the course free", async () => {
    const { course } = await createProduct({ priceInRupees: 0, status: "private" })
    const lesson = await lessonWithAssets(course.id, "public")
    const student = await createUser("student")
    await enroll(student.id, course.id)
    expect((await get(lesson.lessonId, lesson.r2Video.id, student.id)).status).toBe(200)
  })
})

describe("GET /api/v1/lessons/:id", () => {
  it("doesn't list hosted video for a preview, and leaks no key or URL", async () => {
    const { course } = await createProduct({ priceInRupees: 999 })
    const lesson = await lessonWithAssets(course.id, "preview")
    const res = await getLesson(lesson.lessonId, null)
    expect(res.status).toBe(200)
    const body = JSON.parse(res.text) as { assets: { id: string }[] }
    expect(body.assets.map(a => a.id)).toEqual([lesson.pdf.id])
    expect(res.text).not.toMatch(NO_HOSTED_LEAK)
  })

  it("doesn't list hosted video in a free course, even when enrolled", async () => {
    const { course } = await createProduct({ priceInRupees: 0 })
    const lesson = await lessonWithAssets(course.id, "public")
    const student = await createUser("student")
    await enroll(student.id, course.id)
    const body = JSON.parse((await getLesson(lesson.lessonId, student.id)).text) as { assets: { id: string }[] }
    expect(body.assets.map(a => a.id)).toEqual([lesson.pdf.id])
  })

  it("lists hosted video for an enrolled buyer of a paid lesson — still without keys", async () => {
    const { course } = await createProduct({ priceInRupees: 999 })
    const lesson = await lessonWithAssets(course.id, "public")
    const buyer = await createUser("buyer")
    await enroll(buyer.id, course.id)
    const res = await getLesson(lesson.lessonId, buyer.id)
    const body = JSON.parse(res.text) as { assets: { id: string }[] }
    expect(body.assets.map(a => a.id).sort()).toEqual([lesson.r2Video.id, lesson.bunnyVideo.id, lesson.pdf.id].sort())
    expect(res.text).not.toMatch(/secret-video-key|mediadelivery|X-Amz-Signature/)
  })

  it("a user without access to a paid lesson is refused", async () => {
    const { course } = await createProduct({ priceInRupees: 999 })
    const lesson = await lessonWithAssets(course.id, "public")
    const stranger = await createUser("stranger")
    expect((await getLesson(lesson.lessonId, stranger.id)).status).toBe(403)
  })
})

describe("embed delivery", () => {
  async function embedLesson(courseId: string, status: Status) {
    const { lessonId } = await lessonWithAssets(courseId, status)
    const [asset] = await db
      .insert(LessonAssetTable)
      .values({ lessonId, type: "vimeo", provider: "vimeo", role: "primary", status: "ready", externalId: "76979871:abc123def0", startSeconds: 12, order: 3 })
      .returning()
    return { lessonId, embed: asset! }
  }

  it("a preview's embed plays for anyone, as a canonical embed URL", async () => {
    const { course } = await createProduct({ priceInRupees: 999 })
    const { lessonId, embed } = await embedLesson(course.id, "preview")
    const res = await get(lessonId, embed.id, null)
    expect(res.status).toBe(200)
    expect(res.body).toEqual({
      type: "vimeo",
      externalId: "76979871",
      startSeconds: 12,
      embedUrl: "https://player.vimeo.com/video/76979871?h=abc123def0#t=12s",
    })
  })

  it("a paid lesson's embed is never handed out, not even to a buyer", async () => {
    const { course } = await createProduct({ priceInRupees: 999 })
    const { lessonId, embed } = await embedLesson(course.id, "public")
    const buyer = await createUser("buyer")
    await enroll(buyer.id, course.id)
    expect((await get(lessonId, embed.id, buyer.id)).status).toBe(404)
    const body = JSON.parse((await getLesson(lessonId, buyer.id)).text) as { assets: { id: string }[] }
    expect(body.assets.map(a => a.id)).not.toContain(embed.id)
  })

  it("a free course's embed plays for its students and is listed with its start time", async () => {
    const { course } = await createProduct({ priceInRupees: 0 })
    const { lessonId, embed } = await embedLesson(course.id, "public")
    const student = await createUser("student")
    await enroll(student.id, course.id)
    expect((await get(lessonId, embed.id, student.id)).body.type).toBe("vimeo")
    const body = JSON.parse((await getLesson(lessonId, student.id)).text) as { assets: { id: string; startSeconds: number | null }[] }
    expect(body.assets.find(a => a.id === embed.id)?.startSeconds).toBe(12)
  })
})
