/**
 * External video embeds for free-tier lessons (previews and free courses).
 * One allowlist and one normaliser, shared by the web app (editor, server
 * checks, player) and the mobile app (player).
 *
 * A pasted link becomes a canonical embed URL: YouTube via
 * youtube-nocookie.com, Vimeo via player.vimeo.com. Only the video ID, an
 * unlisted-Vimeo hash and a start time survive — every other parameter
 * (tracking, playlists, autoplay…) is dropped.
 */

/** The allowlist. To accept a new provider, add it here and teach parseEmbedUrl its link shapes. */
export const EMBED_PROVIDERS = {
  youtube: {
    label: "YouTube",
    hosts: [
      "youtube.com",
      "www.youtube.com",
      "m.youtube.com",
      "youtu.be",
      "youtube-nocookie.com",
      "www.youtube-nocookie.com",
    ],
  },
  vimeo: {
    label: "Vimeo",
    hosts: ["vimeo.com", "www.vimeo.com", "player.vimeo.com"],
  },
} as const

export type EmbedProvider = keyof typeof EMBED_PROVIDERS

export const EMBED_PROVIDER_NAMES = Object.keys(EMBED_PROVIDERS) as EmbedProvider[]

/** "YouTube or Vimeo" — for messages. */
export const EMBED_PROVIDER_LABELS = joinOr(EMBED_PROVIDER_NAMES.map(p => EMBED_PROVIDERS[p].label))

export type Embed = {
  provider: EmbedProvider
  /** YouTube: the 11-character ID. Vimeo: the numeric ID. */
  videoId: string
  /** Vimeo unlisted videos only: the privacy hash (?h=). */
  hash?: string
  /** Where playback starts, when the link had a start time. */
  startSeconds?: number
}

const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/
const VIMEO_ID = /^\d{6,12}$/
const VIMEO_HASH = /^[0-9a-f]{6,20}$/i
const MAX_START_SECONDS = 24 * 60 * 60

function providerForHost(hostname: string): EmbedProvider | null {
  const host = hostname.toLowerCase()
  for (const provider of EMBED_PROVIDER_NAMES) {
    if ((EMBED_PROVIDERS[provider].hosts as readonly string[]).includes(host)) return provider
  }
  return null
}

/** "90", "90s", "1m30s", "1h2m3s" → seconds. Undefined if it isn't a time or is 0. */
export function parseStartTime(value: string | null | undefined): number | undefined {
  if (!value) return undefined
  const text = value.trim().toLowerCase()
  let seconds: number
  if (/^\d+$/.test(text)) {
    seconds = Number(text)
  } else {
    const match = text.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/)
    if (!match || (!match[1] && !match[2] && !match[3])) return undefined
    seconds = Number(match[1] ?? 0) * 3600 + Number(match[2] ?? 0) * 60 + Number(match[3] ?? 0)
  }
  return Number.isFinite(seconds) && seconds > 0 && seconds <= MAX_START_SECONDS ? seconds : undefined
}

function fragmentStart(hash: string) {
  // "#t=90" / "#t=1m30s"
  return parseStartTime(new URLSearchParams(hash.replace(/^#/, "")).get("t"))
}

/**
 * The embed a pasted link points to, or null if it isn't an allowed video
 * link. Only https (or http, upgraded) links on an allowlisted host count;
 * `javascript:`, `data:`, look-alike hosts and links with credentials don't.
 */
export function parseEmbedUrl(input: string): Embed | null {
  const raw = input.trim()
  if (raw.length === 0 || raw.length > 2048) return null
  let url: URL
  try {
    url = new URL(raw)
  } catch {
    return null
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null
  if (url.username || url.password || url.port) return null
  const provider = providerForHost(url.hostname)
  if (provider == null) return null

  const parts = url.pathname.split("/").filter(Boolean)
  const host = url.hostname.toLowerCase()

  if (provider === "youtube") {
    const [first, second] = parts
    const videoId =
      host === "youtu.be"
        ? first
        : first === "watch"
          ? url.searchParams.get("v")
          : first === "embed" || first === "shorts" || first === "live" || first === "v"
            ? second
            : null
    if (videoId == null || !YOUTUBE_ID.test(videoId)) return null
    const startSeconds =
      parseStartTime(url.searchParams.get("t")) ??
      parseStartTime(url.searchParams.get("start")) ??
      fragmentStart(url.hash)
    return withStart({ provider, videoId }, startSeconds)
  }

  // Vimeo: vimeo.com/ID, vimeo.com/ID/HASH, vimeo.com/channels/x/ID,
  // vimeo.com/groups/x/videos/ID, player.vimeo.com/video/ID?h=HASH
  let videoId: string | undefined
  let hash: string | undefined
  if (host === "player.vimeo.com") {
    if (parts[0] !== "video") return null
    videoId = parts[1]
    hash = url.searchParams.get("h") ?? undefined
  } else {
    const idIndex = parts.findIndex(part => VIMEO_ID.test(part))
    if (idIndex === -1) return null
    const before = parts.slice(0, idIndex)
    const shapeOk =
      before.length === 0 ||
      (before[0] === "channels" && before.length === 2) ||
      (before[0] === "groups" && before.length === 3 && before[2] === "videos") ||
      (before[0] === "video" && before.length === 1)
    if (!shapeOk) return null
    videoId = parts[idIndex]
    hash = parts[idIndex + 1] ?? url.searchParams.get("h") ?? undefined
  }
  if (videoId == null || !VIMEO_ID.test(videoId)) return null
  if (hash != null && !VIMEO_HASH.test(hash)) return null
  const startSeconds = fragmentStart(url.hash) ?? parseStartTime(url.searchParams.get("t"))
  return withStart({ provider, videoId, ...(hash ? { hash } : {}) }, startSeconds)
}

function withStart(embed: Embed, startSeconds: number | undefined): Embed {
  return startSeconds ? { ...embed, startSeconds } : embed
}

/** The canonical embed URL: youtube-nocookie.com / player.vimeo.com, ID, hash and start only. */
export function buildEmbedUrl(embed: Embed): string {
  if (embed.provider === "youtube") {
    const start = embed.startSeconds ? `?start=${embed.startSeconds}` : ""
    return `https://www.youtube-nocookie.com/embed/${embed.videoId}${start}`
  }
  const hash = embed.hash ? `?h=${embed.hash}` : ""
  const start = embed.startSeconds ? `#t=${embed.startSeconds}s` : ""
  return `https://player.vimeo.com/video/${embed.videoId}${hash}${start}`
}

/** A pasted link straight to its canonical embed URL, or null. */
export function normalizeEmbedUrl(input: string): string | null {
  const embed = parseEmbedUrl(input)
  return embed ? buildEmbedUrl(embed) : null
}

/**
 * How an embed is stored on a lesson asset: externalId is the video ID
 * (Vimeo unlisted: "ID:HASH"); the start time has its own column.
 */
export function toStoredEmbed(embed: Embed) {
  return {
    provider: embed.provider,
    externalId: embed.hash ? `${embed.videoId}:${embed.hash}` : embed.videoId,
    startSeconds: embed.startSeconds ?? null,
  }
}

/** The reverse of toStoredEmbed. Null if the stored value isn't a valid embed. */
export function fromStoredEmbed(stored: {
  provider: string
  externalId: string | null
  startSeconds?: number | null
}): Embed | null {
  if (stored.externalId == null) return null
  if (stored.provider === "youtube") {
    return YOUTUBE_ID.test(stored.externalId)
      ? withStart({ provider: "youtube", videoId: stored.externalId }, stored.startSeconds ?? undefined)
      : null
  }
  if (stored.provider === "vimeo") {
    const [videoId, hash] = stored.externalId.split(":")
    if (videoId == null || !VIMEO_ID.test(videoId) || (hash != null && !VIMEO_HASH.test(hash))) return null
    return withStart(
      { provider: "vimeo", videoId, ...(hash ? { hash } : {}) },
      stored.startSeconds ?? undefined,
    )
  }
  return null
}

/** Whether a stored asset provider is an allowed external embed. */
export function isEmbedProvider(provider: string): provider is EmbedProvider {
  return (EMBED_PROVIDER_NAMES as string[]).includes(provider)
}

/** The message for a link that isn't an allowed video link. */
export const INVALID_EMBED_MESSAGE = `That isn't a ${EMBED_PROVIDER_LABELS} video link (e.g. https://www.youtube.com/watch?v=… or https://vimeo.com/…).`

function joinOr(items: string[]) {
  return items.length <= 1 ? (items[0] ?? "") : `${items.slice(0, -1).join(", ")} or ${items.at(-1)}`
}
