"use server"

import { z } from "zod"
import { db } from "@/drizzle/db"
import { CourseSectionTable, LessonAssetTable, LessonTable } from "@/drizzle/schema"
import { PLAYLIST_LINK_MESSAGES, parseYouTubePlaylistLink } from "@repo/video-embeds"
import { getCurrentUser } from "@/services/auth"
import { UserFacingError, actionError } from "@/lib/safeError"
import { canCreateCourseSections } from "@/features/courseSections/permissions/sections"
import { getNextCourseSectionOrder } from "@/features/courseSections/db/sections"
import { revalidateCourseSectionCache } from "@/features/courseSections/db/cache"
import { revalidateLessonCache } from "../db/cache/lessons"
import { revalidateLessonAssetCache } from "../db/cache/lessonAssets"
import { getCourseVideoState } from "../lib/freeTier"
import { PlaylistError, fetchYouTubePlaylist, MAX_PLAYLIST_VIDEOS } from "@/services/youtube/playlists"

// Import a public YouTube playlist as a section of lessons, one per video
// (each lesson's video is that YouTube link). For free courses, and for
// courses not on sale yet; a paid course's lessons can't use YouTube
// links (features/lessons/lib/freeTier.ts), so it's refused there.

const PAID_COURSE_MESSAGE =
  "This course is sold as a paid course, so its lessons can't use YouTube links (only free previews can). Import the playlist into a free course, or a new one."

async function loadPlaylist(courseId: string, url: string) {
  if (!z.string().uuid().safeParse(courseId).success) throw new UserFacingError("Course not found.")
  const user = await getCurrentUser()
  if (!(await canCreateCourseSections(user, courseId))) throw new UserFacingError("You can't edit this course.")

  const link = parseYouTubePlaylistLink(typeof url === "string" ? url : "")
  if (!link.ok) throw new UserFacingError(PLAYLIST_LINK_MESSAGES[link.reason])
  if ((await getCourseVideoState(courseId)) === "paid") throw new UserFacingError(PAID_COURSE_MESSAGE)

  try {
    return await fetchYouTubePlaylist(link.playlistId)
  } catch (error) {
    if (error instanceof PlaylistError) throw new UserFacingError(error.message)
    throw error
  }
}

/** What an import would create: the playlist's title, its videos and anything left out. */
export async function previewPlaylistImport(courseId: string, url: string) {
  try {
    const playlist = await loadPlaylist(courseId, url)
    if (playlist.videos.length === 0) throw new UserFacingError("This playlist has no public videos to import.")
    return {
      error: false as const,
      title: playlist.title,
      channelTitle: playlist.channelTitle,
      videoTitles: playlist.videos.map((video) => video.title),
      skipped: playlist.skipped,
      truncated: playlist.truncated,
      maxVideos: MAX_PLAYLIST_VIDEOS,
    }
  } catch (error) {
    return actionError(error, "previewPlaylistImport", "Couldn't read that playlist.")
  }
}

/**
 * Creates a new section (named `sectionName`, or the playlist's title) at
 * the end of the course, with one lesson per public video, in playlist
 * order. The playlist is read again here; nothing from the browser is
 * trusted but the link.
 */
export async function importPlaylist(courseId: string, url: string, sectionName?: string) {
  try {
    const playlist = await loadPlaylist(courseId, url)
    if (playlist.videos.length === 0) throw new UserFacingError("This playlist has no public videos to import.")
    const name = (typeof sectionName === "string" ? sectionName.trim() : "").slice(0, 120) || playlist.title.slice(0, 120)
    const order = await getNextCourseSectionOrder(courseId)

    const { section, lessons, assets } = await db.transaction(async (tx) => {
      const [section] = await tx
        .insert(CourseSectionTable)
        .values({ name, status: "public", order, courseId })
        .returning({ id: CourseSectionTable.id })
      const lessons = await tx
        .insert(LessonTable)
        .values(
          playlist.videos.map((video, index) => ({
            name: video.title.slice(0, 150),
            status: "public" as const,
            order: index,
            sectionId: section!.id,
          })),
        )
        .returning({ id: LessonTable.id, order: LessonTable.order })
      const byOrder = new Map(lessons.map((lesson) => [lesson.order, lesson.id]))
      const assets = await tx
        .insert(LessonAssetTable)
        .values(
          playlist.videos.map((video, index) => ({
            lessonId: byOrder.get(index)!,
            type: "youtube" as const,
            provider: "youtube" as const,
            role: "primary" as const,
            status: "ready" as const,
            externalId: video.videoId,
            fileName: `YouTube ${video.videoId}`,
          })),
        )
        .returning({ id: LessonAssetTable.id, lessonId: LessonAssetTable.lessonId })
      return { section: section!, lessons, assets }
    })

    revalidateCourseSectionCache({ id: section.id, courseId })
    for (const lesson of lessons) revalidateLessonCache({ id: lesson.id, courseId })
    for (const asset of assets) revalidateLessonAssetCache(asset)

    return {
      error: false as const,
      message: `Imported ${lessons.length} lesson${lessons.length === 1 ? "" : "s"} into “${name}”.`,
      sectionId: section.id,
    }
  } catch (error) {
    return actionError(error, "importPlaylist", "Couldn't import that playlist.")
  }
}
