import { eq } from "drizzle-orm"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { db } from "@/drizzle/db"
import { CourseSectionTable, LessonAssetTable, LessonTable } from "@/drizzle/schema"
import { createProduct } from "@/test/fixtures"
import { parseYouTubeVideoId } from "./youtube"

// YouTube on free preview lessons only (it's public to anyone with the
// link); paid lessons need an uploaded file.

const session = vi.hoisted(() => ({ userId: null as string | null }))
vi.mock("@/lib/auth", () => ({
  auth: { api: { getSession: async () => (session.userId ? { user: { id: session.userId } } : null) } },
}))
vi.mock("next/headers", () => ({ headers: async () => new Headers(), cookies: async () => ({ get: () => undefined }) }))

const { setLessonYouTubeVideo } = await import("../actions/lessonAssets")
const { updateLesson } = await import("../actions/lessons")

describe("parseYouTubeVideoId", () => {
  it.each([
    ["https://www.youtube.com/watch?v=dQw4w9WgXcQ", "dQw4w9WgXcQ"],
    ["https://youtube.com/watch?v=dQw4w9WgXcQ&t=42s", "dQw4w9WgXcQ"],
    ["https://m.youtube.com/watch?v=dQw4w9WgXcQ", "dQw4w9WgXcQ"],
    ["https://youtu.be/dQw4w9WgXcQ?si=abc", "dQw4w9WgXcQ"],
    ["https://www.youtube.com/embed/dQw4w9WgXcQ", "dQw4w9WgXcQ"],
    ["https://www.youtube.com/shorts/dQw4w9WgXcQ", "dQw4w9WgXcQ"],
    ["https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ", "dQw4w9WgXcQ"],
    ["  https://youtu.be/dQw4w9WgXcQ  ", "dQw4w9WgXcQ"],
  ])("%s -> %s", (url, id) => {
    expect(parseYouTubeVideoId(url)).toBe(id)
  })

  it.each([
    "dQw4w9WgXcQ",
    "https://vimeo.com/123",
    "https://youtube.com.evil.example/watch?v=dQw4w9WgXcQ",
    "https://evil.example/?next=https://youtu.be/dQw4w9WgXcQ",
    "javascript:alert(1)//youtu.be/dQw4w9WgXcQ",
    "https://www.youtube.com/watch?v=short",
    "https://www.youtube.com/watch?v=dQw4w9WgXcQ<script>",
    "https://www.youtube.com/channel/UC123",
    "",
  ])("rejects %j", url => {
    expect(parseYouTubeVideoId(url)).toBeNull()
  })
})

describe("YouTube lesson content", () => {
  let creatorId: string
  let sectionId: string
  beforeEach(async () => {
    const { creator, course } = await createProduct()
    creatorId = creator.id
    session.userId = creator.id
    const [section] = await db.insert(CourseSectionTable).values({ name: "s", order: 0, courseId: course.id, status: "public" }).returning()
    sectionId = section!.id
  })
  const lesson = async (status: "preview" | "public" | "private") =>
    (await db.insert(LessonTable).values({ name: "l", order: 0, status, sectionId }).returning())[0]!
  const assetsOf = (lessonId: string) => db.select().from(LessonAssetTable).where(eq(LessonAssetTable.lessonId, lessonId))

  it("a preview lesson can use a YouTube link; it replaces the previous video", async () => {
    const preview = await lesson("preview")
    expect((await setLessonYouTubeVideo(preview.id, "https://youtu.be/dQw4w9WgXcQ")).error).toBe(false)
    expect((await setLessonYouTubeVideo(preview.id, "https://www.youtube.com/watch?v=9bZkp7q19f0")).error).toBe(false)
    const assets = await assetsOf(preview.id)
    expect(assets).toHaveLength(1)
    expect(assets[0]).toMatchObject({ provider: "youtube", externalId: "9bZkp7q19f0", status: "ready", role: "primary" })
  })

  it("a paid (public) or private lesson can't", async () => {
    for (const status of ["public", "private"] as const) {
      const paid = await lesson(status)
      const result = await setLessonYouTubeVideo(paid.id, "https://youtu.be/dQw4w9WgXcQ")
      expect(result).toMatchObject({ error: true, message: expect.stringContaining("free preview lessons") })
      expect(await assetsOf(paid.id)).toHaveLength(0)
    }
  })

  it("an invalid link is rejected", async () => {
    const preview = await lesson("preview")
    expect(await setLessonYouTubeVideo(preview.id, "https://vimeo.com/1")).toMatchObject({ error: true })
    expect(await assetsOf(preview.id)).toHaveLength(0)
  })

  it("another creator can't set a video on your lesson", async () => {
    const preview = await lesson("preview")
    const other = await createProduct()
    session.userId = other.creator.id
    expect(await setLessonYouTubeVideo(preview.id, "https://youtu.be/dQw4w9WgXcQ")).toMatchObject({ error: true })
    expect(await assetsOf(preview.id)).toHaveLength(0)
    session.userId = creatorId
  })

  it("a lesson with a YouTube video can't be switched to paid", async () => {
    const preview = await lesson("preview")
    await setLessonYouTubeVideo(preview.id, "https://youtu.be/dQw4w9WgXcQ")
    const result = await updateLesson(preview.id, { name: "l", status: "public", description: null, sectionId })
    expect(result).toMatchObject({ error: true, message: expect.stringContaining("free preview lessons") })
    const [after] = await db.select().from(LessonTable).where(eq(LessonTable.id, preview.id))
    expect(after!.status).toBe("preview")
  })
})
