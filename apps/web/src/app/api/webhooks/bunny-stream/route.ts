import { and, eq } from "drizzle-orm"
import { NextResponse } from "next/server"
import { db } from "@/drizzle/db"
import { LessonAssetTable } from "@/drizzle/schema"
import { syncBunnyLessonAsset } from "@/features/lessons/lib/bunnyVideos"
import { getBunnyConfig, verifyBunnyWebhook } from "@/services/bunny/stream"
import { routeError } from "@/lib/safeError"

/**
 * Bunny Stream calls this when a video's status changes (set it in the
 * library: Stream → library → Webhook URL = https://www.chiyali.com/api/webhooks/bunny-stream).
 * Signed with the library's Read-Only API key; anything unsigned is refused.
 * The body only says which video changed: its status is re-read from
 * Bunny's API (syncBunnyLessonAsset), so a replayed or reordered
 * notification can't make a video ready early. The payment cron does the
 * same for anything a webhook missed.
 */
export async function POST(request: Request) {
  try {
    const rawBody = await request.text()
    if (!verifyBunnyWebhook(rawBody, request.headers)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
    }

    let payload: { VideoLibraryId?: unknown; VideoGuid?: unknown }
    try {
      payload = JSON.parse(rawBody)
    } catch {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 })
    }
    const config = getBunnyConfig()
    if (config == null || String(payload.VideoLibraryId) !== config.libraryId || typeof payload.VideoGuid !== "string") {
      return NextResponse.json({ ok: true, ignored: true })
    }

    const asset = await db.query.LessonAssetTable.findFirst({
      where: and(eq(LessonAssetTable.provider, "bunny"), eq(LessonAssetTable.externalId, payload.VideoGuid)),
      columns: { id: true, lessonId: true, provider: true, status: true, externalId: true, createdAt: true },
    })
    // Not ours (anymore): acknowledge so Bunny doesn't retry.
    if (asset == null) return NextResponse.json({ ok: true, ignored: true })

    const status = await syncBunnyLessonAsset(asset)
    return NextResponse.json({ ok: true, status })
  } catch (error) {
    return routeError(error, "bunny: webhook", 500, undefined, { area: "route" })
  }
}
