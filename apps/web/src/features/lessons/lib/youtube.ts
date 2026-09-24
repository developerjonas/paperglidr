// YouTube is allowed for free preview lessons only: a YouTube video is
// public to anyone with the link, so paid content must be an uploaded file
// served through signed URLs. Shared by the lesson editor (fail fast) and
// the server (the real check).

const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/
const HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "youtu.be",
  "youtube-nocookie.com",
  "www.youtube-nocookie.com",
])

/**
 * The 11-character video ID from a YouTube link, or null. Accepts
 * watch?v=, youtu.be/, /embed/, /shorts/ and /live/ links over http(s).
 */
export function parseYouTubeVideoId(input: string): string | null {
  let url: URL
  try {
    url = new URL(input.trim())
  } catch {
    return null
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null
  if (!HOSTS.has(url.hostname.toLowerCase())) return null

  const [first, second] = url.pathname.split("/").filter(Boolean)
  const id =
    url.hostname.toLowerCase() === "youtu.be"
      ? first
      : first === "watch"
        ? url.searchParams.get("v")
        : first === "embed" || first === "shorts" || first === "live"
          ? second
          : null
  return id != null && VIDEO_ID.test(id) ? id : null
}

/** Whether a lesson with this status may show a YouTube video. */
export const youtubeAllowedFor = (lessonStatus: string) => lessonStatus === "preview"

export const YOUTUBE_PREVIEW_ONLY_MESSAGE =
  "YouTube videos can only be used on free preview lessons. Paid lessons need an uploaded MP4."
