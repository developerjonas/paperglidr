import { asc, eq, inArray } from "drizzle-orm"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { db } from "@/drizzle/db"
import { CourseSectionTable, LessonAssetTable, LessonTable } from "@/drizzle/schema"
import { createProduct } from "@/test/fixtures"

// Importing a YouTube playlist as a section of lessons: the YouTube API is
// faked; everything else (permissions, rules, database) is real.

vi.hoisted(() => {
  process.env.YOUTUBE_API_KEY = "test-youtube-key"
})
const session = vi.hoisted(() => ({ userId: null as string | null }))
vi.mock("@/lib/auth", () => ({
  auth: { api: { getSession: async () => (session.userId ? { user: { id: session.userId } } : null) } },
}))
vi.mock("next/headers", () => ({ headers: async () => new Headers(), cookies: async () => ({ get: () => undefined }) }))

const { previewPlaylistImport, importPlaylist } = await import("./playlistImport")
const { getLessonVideoRules } = await import("../lib/freeTier")

const PLAYLIST = "PLx0sYbCqOb8TBPRdmBHs5Iftvv9TPboYG"
const LINK = `https://www.youtube.com/playlist?list=${PLAYLIST}`
const item = (videoId: string, title: string, privacyStatus = "public") => ({
  snippet: { title, resourceId: { kind: "youtube#video", videoId } },
  status: { privacyStatus },
})

/** A fake YouTube Data API: a 2-page playlist with one private video. */
function fakeYouTube() {
  return vi.fn(async (input: string | URL) => {
    const url = new URL(String(input))
    if (url.searchParams.get("key") !== "test-youtube-key") return new Response("bad key", { status: 403 })
    if (url.pathname.endsWith("/playlists")) {
      return Response.json({ items: url.searchParams.get("id") === PLAYLIST ? [{ snippet: { title: "Loksewa GK Series", channelTitle: "Anita Karki" } }] : [] })
    }
    if (url.pathname.endsWith("/playlistItems")) {
      return url.searchParams.get("pageToken") === "PAGE2"
        ? Response.json({ items: [item("dddddddddd4", "Part 4: Constitution"), item("eeeeeeeeee5", "Part 5: Current affairs")] })
        : Response.json({
            items: [item("aaaaaaaaaa1", "Part 1: History"), item("bbbbbbbbbb2", "Private video", "private"), item("cccccccccc3", "Part 3: Geography")],
            nextPageToken: "PAGE2",
          })
    }
    return new Response("not found", { status: 404 })
  })
}

let fetchMock: ReturnType<typeof fakeYouTube>
beforeEach(() => {
  fetchMock = fakeYouTube()
  vi.stubGlobal("fetch", fetchMock)
})
afterEach(() => vi.unstubAllGlobals())

const sectionsOf = (courseId: string) =>
  db.select().from(CourseSectionTable).where(eq(CourseSectionTable.courseId, courseId))

describe("YouTube playlist import", () => {
  it("previews the public videos, in order, across pages", async () => {
    const { creator, course } = await createProduct({ status: "private" }) // a draft course
    session.userId = creator.id
    expect(await previewPlaylistImport(course.id, LINK)).toMatchObject({
      error: false,
      title: "Loksewa GK Series",
      channelTitle: "Anita Karki",
      videoTitles: ["Part 1: History", "Part 3: Geography", "Part 4: Constitution", "Part 5: Current affairs"],
      skipped: 1,
      truncated: false,
    })
    expect(await sectionsOf(course.id)).toHaveLength(0) // a preview creates nothing
  })

  it("imports a section with one YouTube lesson per video", async () => {
    const { creator, course } = await createProduct({ status: "private" })
    session.userId = creator.id
    expect(await importPlaylist(course.id, LINK, "  Part one  ")).toMatchObject({ error: false, message: expect.stringContaining("4 lessons") })

    const [section] = await sectionsOf(course.id)
    expect(section).toMatchObject({ name: "Part one", status: "public" })
    const lessons = await db.select().from(LessonTable).where(eq(LessonTable.sectionId, section!.id)).orderBy(asc(LessonTable.order))
    expect(lessons.map((l) => [l.order, l.name, l.status])).toEqual([
      [0, "Part 1: History", "public"],
      [1, "Part 3: Geography", "public"],
      [2, "Part 4: Constitution", "public"],
      [3, "Part 5: Current affairs", "public"],
    ])
    const assets = await db.select().from(LessonAssetTable).where(inArray(LessonAssetTable.lessonId, lessons.map((l) => l.id)))
    expect(assets.map((a) => [a.provider, a.status, a.role]).every(([p, s, r]) => p === "youtube" && s === "ready" && r === "primary")).toBe(true)
    expect(assets.map((a) => a.externalId).sort()).toEqual(["aaaaaaaaaa1", "cccccccccc3", "dddddddddd4", "eeeeeeeeee5"])
    // The links are allowed (and will play) in a course that isn't on sale yet.
    expect(await getLessonVideoRules(lessons[0]!.id)).toMatchObject({ embedsAllowed: true })
  })

  it("names the section after the playlist when no name is given", async () => {
    const { creator, course } = await createProduct({ priceInRupees: 0 }) // a free course
    session.userId = creator.id
    await importPlaylist(course.id, LINK)
    expect((await sectionsOf(course.id))[0]?.name).toBe("Loksewa GK Series")
  })

  it("refuses a paid course: its lessons can't use YouTube links", async () => {
    const { creator, course } = await createProduct({ priceInRupees: 999 })
    session.userId = creator.id
    expect(await importPlaylist(course.id, LINK)).toMatchObject({ error: true, message: expect.stringContaining("paid course") })
    expect(await sectionsOf(course.id)).toHaveLength(0)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("only the course's creator (or an admin) can import", async () => {
    const { course } = await createProduct({ status: "private" })
    session.userId = (await createProduct()).creator.id
    expect(await importPlaylist(course.id, LINK)).toMatchObject({ error: true, message: "You can't edit this course." })
    expect(await sectionsOf(course.id)).toHaveLength(0)
  })

  it("explains bad links and unknown playlists", async () => {
    const { creator, course } = await createProduct({ status: "private" })
    session.userId = creator.id
    expect(await previewPlaylistImport(course.id, "https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toMatchObject({ error: true, message: expect.stringContaining("isn't a YouTube playlist link") })
    expect(await previewPlaylistImport(course.id, "https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=RDdQw4w9WgXcQ")).toMatchObject({ error: true, message: expect.stringContaining("Mix") })
    expect(await previewPlaylistImport(course.id, "https://www.youtube.com/playlist?list=PLdoesnotexist000")).toMatchObject({ error: true, message: expect.stringContaining("doesn't exist or isn't public") })
  })
})
