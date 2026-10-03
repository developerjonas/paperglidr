import "server-only"
import { env } from "@/data/env/server"

// Reads a public YouTube playlist through the YouTube Data API v3
// (YOUTUBE_API_KEY; free quota: each page of 50 videos costs 1 unit of
// 10,000 a day). Used by the course editor's playlist import.

const API = "https://www.googleapis.com/youtube/v3"
const PAGE_SIZE = 50
export const MAX_PLAYLIST_VIDEOS = 200

export type PlaylistVideo = { videoId: string; title: string }
export type Playlist = {
  title: string
  channelTitle: string
  videos: PlaylistVideo[]
  /** Private or deleted videos left out. */
  skipped: number
  /** True when the playlist had more than MAX_PLAYLIST_VIDEOS. */
  truncated: boolean
}

export class PlaylistError extends Error {
  constructor(
    readonly reason: "not_configured" | "not_found" | "unavailable",
    message: string,
  ) {
    super(message)
    this.name = "PlaylistError"
  }
}

type ApiList<T> = { items?: T[]; nextPageToken?: string; pageInfo?: { totalResults?: number } }
type PlaylistResource = { snippet?: { title?: string; channelTitle?: string } }
type PlaylistItemResource = {
  snippet?: { title?: string; resourceId?: { kind?: string; videoId?: string } }
  status?: { privacyStatus?: string }
}

async function call<T>(path: string, params: Record<string, string>): Promise<ApiList<T>> {
  const key = env.YOUTUBE_API_KEY
  if (!key) throw new PlaylistError("not_configured", "Playlist import isn't set up yet (YOUTUBE_API_KEY).")
  const url = new URL(`${API}/${path}`)
  for (const [name, value] of Object.entries({ ...params, key })) url.searchParams.set(name, value)
  let response: Response
  try {
    response = await fetch(url, { signal: AbortSignal.timeout(10_000), cache: "no-store" })
  } catch {
    throw new PlaylistError("unavailable", "Couldn't reach YouTube. Please try again.")
  }
  if (response.status === 404) throw new PlaylistError("not_found", "That playlist doesn't exist or isn't public.")
  if (!response.ok) {
    // 403: quota used up or a bad key; 5xx: YouTube trouble.
    console.error("[youtube] playlist API error", response.status, await response.text().catch(() => ""))
    throw new PlaylistError("unavailable", "YouTube didn't answer properly. Please try again later.")
  }
  return (await response.json()) as ApiList<T>
}

/** The playlist's title and its public/unlisted videos, in playlist order. */
export async function fetchYouTubePlaylist(playlistId: string): Promise<Playlist> {
  const meta = await call<PlaylistResource>("playlists", { part: "snippet", id: playlistId, maxResults: "1" })
  const playlist = meta.items?.[0]?.snippet
  if (!playlist) throw new PlaylistError("not_found", "That playlist doesn't exist or isn't public.")

  const videos: PlaylistVideo[] = []
  let skipped = 0
  let truncated = false
  let pageToken: string | undefined
  do {
    const page = await call<PlaylistItemResource>("playlistItems", {
      part: "snippet,status",
      playlistId,
      maxResults: String(PAGE_SIZE),
      ...(pageToken ? { pageToken } : {}),
    })
    for (const item of page.items ?? []) {
      const videoId = item.snippet?.resourceId?.videoId
      const privacy = item.status?.privacyStatus
      const title = item.snippet?.title?.trim()
      // Private and deleted videos can't be embedded.
      if (!videoId || !/^[A-Za-z0-9_-]{11}$/.test(videoId) || (privacy !== "public" && privacy !== "unlisted") || !title) {
        skipped++
        continue
      }
      if (videos.length === MAX_PLAYLIST_VIDEOS) {
        truncated = true
        break
      }
      videos.push({ videoId, title })
    }
    pageToken = truncated ? undefined : page.nextPageToken
  } while (pageToken)

  return {
    title: playlist.title?.trim() || "YouTube playlist",
    channelTitle: playlist.channelTitle?.trim() ?? "",
    videos,
    skipped,
    truncated,
  }
}
