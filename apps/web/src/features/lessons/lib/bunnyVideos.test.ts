import crypto from "node:crypto"
import { eq } from "drizzle-orm"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { db } from "@/drizzle/db"
import {
  CourseSectionTable,
  InstructorTable,
  LessonAssetTable,
  LessonTable,
  SessionTable,
  StorageDeletionTable,
  UserCourseAccessTable,
  UserTable,
} from "@/drizzle/schema"
import { createProduct, createUser } from "@/test/fixtures"

// Paid lesson video on Bunny Stream: uploads within the creator's storage
// limit, encoding status from Bunny's API (webhook, editor, cron), cleanup
// of abandoned and replaced videos, protected playback, and the two-device
// sign-in limit.

process.env.MOBILE_API_ENABLED = "true"
process.env.BUNNY_STREAM_LIBRARY_ID = "lib-1"
process.env.BUNNY_STREAM_API_KEY = "api-key"
process.env.BUNNY_STREAM_TOKEN_AUTH_KEY = "token-key"
process.env.BUNNY_STREAM_READ_ONLY_API_KEY = "read-only-key"

const session = vi.hoisted(() => ({ userId: null as string | null }))
vi.mock("@/lib/auth", () => ({
  auth: { api: { getSession: async () => (session.userId ? { user: { id: session.userId } } : null) } },
}))
vi.mock("next/headers", () => ({ headers: async () => new Headers(), cookies: async () => ({ get: () => undefined }) }))

// Bunny's HTTP API, faked: each video's status is set by the test.
const bunny = vi.hoisted(() => ({
  videos: new Map<string, { status: number; length: number; availableResolutions: string | null }>(),
  deleted: [] as string[],
}))
vi.mock("@/services/bunny/stream", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/services/bunny/stream")>()
  return {
    ...actual,
    createBunnyVideo: async () => {
      const guid = crypto.randomUUID()
      bunny.videos.set(guid, { status: 0, length: 0, availableResolutions: null })
      return { guid, status: 0, length: 0, storageSize: 0, availableResolutions: null, encodeProgress: 0 }
    },
    getBunnyVideo: async (guid: string) => {
      const v = bunny.videos.get(guid)
      return v ? { guid, storageSize: 0, encodeProgress: 0, ...v } : null
    },
    deleteBunnyVideo: async (guid: string) => {
      bunny.deleted.push(guid)
      bunny.videos.delete(guid)
    },
  }
})

const { requestLessonVideoUpload, getLessonStorageUsage, removeLessonAsset } = await import("../actions/lessonAssets")
const { syncPendingBunnyVideos } = await import("./bunnyVideos")
const { cleanUpUploads, STALE_PENDING_UPLOAD_MS } = await import("./uploadCleanup")
const { STORAGE_DELETION_DELAY_MS } = await import("../db/lessonAssets")
const webhook = await import("@/app/api/webhooks/bunny-stream/route")
const deliver = await import("@/app/api/lessons/[lessonId]/assets/[assetId]/deliver/route")
const { enforceSessionLimit } = await import("@/features/users/lib/sessionLimit")
const { setCreatorStorageLimit } = await import("@/features/admin/actions/users")

const GB = 1024 ** 3
let creatorId: string
let courseId: string
let lessonId: string

beforeEach(async () => {
  const { creator, course } = await createProduct({ priceInRupees: 999 })
  creatorId = creator.id
  courseId = course.id
  session.userId = creator.id
  await db.insert(InstructorTable).values({ userId: creator.id, handle: `c${creator.id.slice(0, 8)}`, name: "C", bio: "b", profileImageUrl: "/x.png" })
  const [section] = await db.insert(CourseSectionTable).values({ name: "s", order: 0, courseId, status: "public" }).returning()
  lessonId = (await db.insert(LessonTable).values({ name: "Paid lesson", order: 0, status: "public", sectionId: section!.id }).returning())[0]!.id
})

const upload = (bytes: number, id = lessonId) => requestLessonVideoUpload({ lessonId: id, fileName: "v.mp4", mimeType: "video/mp4", fileSizeBytes: bytes })
const assetsOf = (id = lessonId) => db.select().from(LessonAssetTable).where(eq(LessonAssetTable.lessonId, id))
const setVideo = (guid: string, status: number, length = 300, availableResolutions: string | null = status === 4 ? "720p" : null) =>
  bunny.videos.set(guid, { status, length, availableResolutions })

describe("storage limit (5 GB by default)", () => {
  it("counts uploads in progress and refuses one that would go over", async () => {
    expect(await upload(3 * GB)).toMatchObject({ error: false })
    expect(await getLessonStorageUsage(lessonId)).toEqual({ usedBytes: 3 * GB, limitBytes: 5 * GB })
    const tooBig = await upload(2.5 * GB)
    expect(tooBig).toMatchObject({ error: true, message: expect.stringContaining("Not enough storage: you've used 3 GB of 5 GB (2 GB left)") })
    expect(await assetsOf()).toHaveLength(1)
  })

  it("an admin can raise it; a failed encode stops counting", async () => {
    const first = (await upload(4 * GB)) as { assetId: string }
    expect(await upload(2 * GB)).toMatchObject({ error: true })

    const admin = await createUser("admin")
    await db.update(UserTable).set({ role: "admin" }).where(eq(UserTable.id, admin.id))
    session.userId = admin.id
    expect(await setCreatorStorageLimit(creatorId, 10)).toMatchObject({ error: false, message: "Storage limit set to 10 GB." })
    session.userId = creatorId
    expect(await upload(2 * GB)).toMatchObject({ error: false })

    const [asset] = await db.select().from(LessonAssetTable).where(eq(LessonAssetTable.id, first.assetId))
    setVideo(asset!.externalId!, 5) // Bunny: encoding failed
    await syncPendingBunnyVideos()
    expect((await getLessonStorageUsage(lessonId)).usedBytes).toBe(2 * GB)
  })

  it("refuses formats Bunny can't take and files over 4 GB", async () => {
    expect(await requestLessonVideoUpload({ lessonId, fileName: "a.avi", mimeType: "video/x-msvideo", fileSizeBytes: 10 })).toMatchObject({ error: true })
    expect(await upload(4 * GB + 1)).toMatchObject({ error: true, message: "Videos can be at most 4 GB." })
  })
})

describe("encoding status", () => {
  it("stays processing while Bunny encodes, becomes ready (with its length), replaces the old video", async () => {
    const first = (await upload(1000)) as { assetId: string }
    const [a1] = await assetsOf()
    setVideo(a1!.externalId!, 4, 610)
    await syncPendingBunnyVideos()
    const second = (await upload(1000)) as { assetId: string }
    const a2 = (await assetsOf()).find((a) => a.id === second.assetId)!
    setVideo(a2.externalId!, 3) // transcoding, nothing playable yet
    expect(await syncPendingBunnyVideos()).toMatchObject({ ready: 0 })
    setVideo(a2.externalId!, 3, 200, "360p") // first resolution done: playable
    await syncPendingBunnyVideos()

    const rows = await assetsOf()
    expect(rows).toEqual([expect.objectContaining({ id: second.assetId, status: "ready", durationSeconds: 200 })])
    const queued = await db.select().from(StorageDeletionTable).where(eq(StorageDeletionTable.storageKey, a1!.externalId!))
    expect(queued).toEqual([expect.objectContaining({ provider: "bunny", reason: "replaced" })])
    expect(first.assetId).not.toBe(second.assetId)
  })

  it("a video Bunny never received is failed after an hour", async () => {
    const { assetId } = (await upload(1000)) as { assetId: string }
    const [a] = await assetsOf()
    bunny.videos.delete(a!.externalId!)
    await syncPendingBunnyVideos()
    expect((await assetsOf())[0]!.status).toBe("pending")
    await syncPendingBunnyVideos({ now: new Date(Date.now() + 61 * 60 * 1000) })
    expect((await db.select().from(LessonAssetTable).where(eq(LessonAssetTable.id, assetId)))[0]!.status).toBe("failed")
  })
})

describe("webhook", () => {
  const post = (body: object, secret = "read-only-key") => {
    const raw = JSON.stringify(body)
    const signature = crypto.createHmac("sha256", secret).update(raw, "utf8").digest("hex")
    return webhook.POST(
      new Request("http://t/api/webhooks/bunny-stream", {
        method: "POST",
        body: raw,
        headers: { "x-bunnystream-signature": signature, "x-bunnystream-signature-version": "v1", "x-bunnystream-signature-algorithm": "hmac-sha256" },
      }),
    )
  }

  it("refuses an unsigned or wrongly signed call", async () => {
    const res = await post({ VideoLibraryId: "lib-1", VideoGuid: "x" }, "wrong")
    expect(res.status).toBe(401)
  })

  it("re-reads the video from Bunny: a 'finished' message alone changes nothing", async () => {
    await upload(1000)
    const [a] = await assetsOf()
    // The message claims finished (3), but Bunny's API still says uploading.
    expect(await (await post({ VideoLibraryId: "lib-1", VideoGuid: a!.externalId, Status: 3 })).json()).toMatchObject({ status: "pending" })
    setVideo(a!.externalId!, 4)
    expect(await (await post({ VideoLibraryId: "lib-1", VideoGuid: a!.externalId, Status: 3 })).json()).toMatchObject({ status: "ready" })
    expect(await (await post({ VideoLibraryId: "other-lib", VideoGuid: a!.externalId })).json()).toMatchObject({ ignored: true })
  })
})

describe("cleanup", () => {
  it("deletes abandoned uploads from Bunny, removed videos after the delay, and old failed rows", async () => {
    await upload(1000)
    const [abandoned] = await assetsOf()
    await cleanUpUploads({ now: new Date(Date.now() + STALE_PENDING_UPLOAD_MS + 60_000) })
    expect(bunny.deleted).toContain(abandoned!.externalId)
    expect(await assetsOf()).toHaveLength(0)

    const { assetId } = (await upload(1000)) as { assetId: string }
    const [ready] = await assetsOf()
    setVideo(ready!.externalId!, 4)
    await syncPendingBunnyVideos()
    await removeLessonAsset(assetId, lessonId)
    await cleanUpUploads()
    expect(bunny.deleted).not.toContain(ready!.externalId) // still within the delay
    await cleanUpUploads({ now: new Date(Date.now() + STORAGE_DELETION_DELAY_MS + 60_000) })
    expect(bunny.deleted).toContain(ready!.externalId)
  })
})

describe("playback", () => {
  const play = async (assetId: string) =>
    deliver.GET(new Request(`http://t/api/lessons/${lessonId}/assets/${assetId}/deliver`) as never, {
      params: Promise.resolve({ lessonId, assetId }),
    })

  it("a buyer gets a signed Bunny player link and their watermark; others get nothing", async () => {
    const { assetId } = (await upload(1000)) as { assetId: string }
    const [a] = await assetsOf()
    setVideo(a!.externalId!, 4, 600)
    await syncPendingBunnyVideos()

    const buyer = await createUser("buyer")
    await db.update(UserTable).set({ name: "Sita Sharma" }).where(eq(UserTable.id, buyer.id))
    await db.insert(UserCourseAccessTable).values({ userId: buyer.id, courseId })
    session.userId = buyer.id
    const res = await play(assetId)
    const body = await res.json()
    expect(body).toMatchObject({ type: "bunny_embed", watermark: `Sita Sharma · ${buyer.email}` })
    const url = new URL(body.url)
    expect(url.hostname).toBe("player.mediadelivery.net")
    expect(url.pathname).toBe(`/embed/lib-1/${a!.externalId}`)
    expect(Number(url.searchParams.get("expires")) - Date.now() / 1000).toBeGreaterThan(1190) // 2 × 600 s

    session.userId = (await createUser("stranger")).id
    expect((await play(assetId)).status).toBe(403)
    session.userId = null
    expect((await play(assetId)).status).toBe(401)

    // Never on a free-tier lesson, even for a buyer: a preview's video must be a link.
    await db.update(LessonTable).set({ status: "preview" }).where(eq(LessonTable.id, lessonId))
    session.userId = buyer.id
    expect((await play(assetId)).status).toBe(404)
  })
})

describe("two signed-in devices per account", () => {
  const sessionsOf = async (userId: string) =>
    (await db.select().from(SessionTable).where(eq(SessionTable.userId, userId))).map((s) => s.token)
  async function signIn(userId: string, n: number) {
    const [row] = await db
      .insert(SessionTable)
      .values({ userId, token: `t${n}-${userId}`, expiresAt: new Date(Date.now() + 86_400_000), createdAt: new Date(Date.now() + n * 1000) })
      .returning()
    await enforceSessionLimit(userId, row!.id)
  }

  it("a third sign-in signs out the oldest; admins are exempt", async () => {
    const user = await createUser()
    for (const n of [1, 2, 3]) await signIn(user.id, n)
    expect((await sessionsOf(user.id)).sort()).toEqual([`t2-${user.id}`, `t3-${user.id}`])

    const admin = await createUser("admin")
    await db.update(UserTable).set({ role: "admin" }).where(eq(UserTable.id, admin.id))
    for (const n of [1, 2, 3]) await signIn(admin.id, n)
    expect(await sessionsOf(admin.id)).toHaveLength(3)
  })
})
