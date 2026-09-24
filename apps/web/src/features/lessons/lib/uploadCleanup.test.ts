import { eq } from "drizzle-orm"
import { describe, expect, it } from "vitest"
import { db } from "@/drizzle/db"
import { CourseSectionTable, LessonAssetTable, LessonTable, StorageDeletionTable } from "@/drizzle/schema"
import { createProduct } from "@/test/fixtures"
import { deleteLessonAsset, markLessonAssetReady, STORAGE_DELETION_DELAY_MS } from "../db/lessonAssets"
import { cleanUpUploads, STALE_PENDING_UPLOAD_MS } from "./uploadCleanup"

// Upload cleanup: abandoned pending uploads, and the R2 objects of
// replaced or removed lesson files once no signed URL can still use them.

const HOUR = 60 * 60 * 1000

async function lesson() {
  const { course } = await createProduct()
  const [section] = await db.insert(CourseSectionTable).values({ name: "s", order: 0, courseId: course.id }).returning()
  const [row] = await db.insert(LessonTable).values({ name: "l", order: 0, sectionId: section!.id }).returning()
  return row!
}

async function asset(lessonId: string, { status = "ready" as "ready" | "pending", ageMs = 0 } = {}) {
  const storageKey = `courses/test/lessons/${lessonId}/${crypto.randomUUID()}.mp4`
  const [row] = await db
    .insert(LessonAssetTable)
    .values({
      lessonId,
      type: "video_file",
      provider: "r2",
      role: "primary",
      storageKey,
      mimeType: "video/mp4",
      status,
      createdAt: new Date(Date.now() - ageMs),
    })
    .returning()
  return row!
}

function fakeR2() {
  const deleted: string[] = []
  return { deleted, deleteObject: async (key: string) => void deleted.push(key) }
}

const exists = async (id: string) =>
  (await db.select().from(LessonAssetTable).where(eq(LessonAssetTable.id, id))).length === 1
const queued = async (storageKey: string) =>
  (await db.select().from(StorageDeletionTable).where(eq(StorageDeletionTable.storageKey, storageKey))).length

describe("upload cleanup", () => {
  it("deletes pending uploads older than 24 hours (row and object), keeps newer ones", async () => {
    const { id: lessonId } = await lesson()
    const stale = await asset(lessonId, { status: "pending", ageMs: STALE_PENDING_UPLOAD_MS + HOUR })
    const fresh = await asset(lessonId, { status: "pending", ageMs: HOUR })
    const r2 = fakeR2()
    await cleanUpUploads({ deleteObject: r2.deleteObject, limit: 10_000 })
    expect(await exists(stale.id)).toBe(false)
    expect(r2.deleted).toContain(stale.storageKey)
    expect(await exists(fresh.id)).toBe(true)
    expect(r2.deleted).not.toContain(fresh.storageKey)
  })

  it("a replaced primary's object is deleted only after the signed-URL delay", async () => {
    const { id: lessonId } = await lesson()
    const old = await asset(lessonId)
    const replacement = await asset(lessonId, { status: "pending" })
    await markLessonAssetReady(replacement.id)
    expect(await exists(old.id)).toBe(false)
    expect(await queued(old.storageKey!)).toBe(1)

    const r2 = fakeR2()
    await cleanUpUploads({ deleteObject: r2.deleteObject, limit: 10_000 })
    expect(r2.deleted).not.toContain(old.storageKey) // may still be playing

    await cleanUpUploads({
      deleteObject: r2.deleteObject,
      limit: 10_000,
      now: new Date(Date.now() + STORAGE_DELETION_DELAY_MS + 60_000),
    })
    expect(r2.deleted).toContain(old.storageKey)
    expect(r2.deleted).not.toContain(replacement.storageKey)
    expect(await queued(old.storageKey!)).toBe(0)
  })

  it("a removed asset's object is queued too; a key still in use is never deleted", async () => {
    const { id: lessonId } = await lesson()
    const removed = await asset(lessonId)
    await deleteLessonAsset(removed.id)
    expect(await queued(removed.storageKey!)).toBe(1)

    const kept = await asset(lessonId)
    await db.insert(StorageDeletionTable).values({ storageKey: kept.storageKey!, reason: "removed", deleteAfter: new Date(0) })

    const r2 = fakeR2()
    await cleanUpUploads({
      deleteObject: r2.deleteObject,
      limit: 10_000,
      now: new Date(Date.now() + STORAGE_DELETION_DELAY_MS + 60_000),
    })
    expect(r2.deleted).toContain(removed.storageKey)
    expect(r2.deleted).not.toContain(kept.storageKey)
    expect(await queued(kept.storageKey!)).toBe(0)
    expect(await exists(kept.id)).toBe(true)
  })

  it("a failed R2 delete is kept for the next run", async () => {
    const { id: lessonId } = await lesson()
    const stale = await asset(lessonId, { status: "pending", ageMs: STALE_PENDING_UPLOAD_MS + HOUR })
    const summary = await cleanUpUploads({
      limit: 10_000,
      deleteObject: async key => {
        if (key === stale.storageKey) throw new Error("R2 down")
      },
    })
    expect(summary.failed).toBeGreaterThanOrEqual(1)
    expect(await exists(stale.id)).toBe(true)
  })
})
