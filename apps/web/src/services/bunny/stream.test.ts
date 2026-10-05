import crypto from "crypto"
import { describe, expect, it } from "vitest"

// Signatures exactly as Bunny documents them (docs.bunny.net/stream/*).
process.env.BUNNY_STREAM_LIBRARY_ID = "759"
process.env.BUNNY_STREAM_API_KEY = "api-key"
process.env.BUNNY_STREAM_TOKEN_AUTH_KEY = "token-key"
process.env.BUNNY_STREAM_READ_ONLY_API_KEY = "read-only-key"

const { bunnyUploadCredentials, bunnyEmbedUrl, verifyBunnyWebhook, bunnyVideoState, BUNNY_VIDEO_STATUS } = await import("./stream")
const sha256 = (s: string) => crypto.createHash("sha256").update(s).digest("hex")

describe("Bunny Stream", () => {
  it("signs TUS uploads as SHA256(library_id + api_key + expiration_time + video_id)", () => {
    const creds = bunnyUploadCredentials("video-guid", 3600)
    expect(creds).toMatchObject({ endpoint: "https://video.bunnycdn.com/tusupload", libraryId: "759", videoId: "video-guid" })
    expect(creds.signature).toBe(sha256(`759api-key${creds.expires}video-guid`))
    expect(creds.expires - Math.floor(Date.now() / 1000)).toBeGreaterThan(3590)
  })

  it("signs player links as SHA256_HEX(token_key + video_id + expires) on player.mediadelivery.net", () => {
    const { url, expires } = bunnyEmbedUrl("video-guid", 7200)
    const parsed = new URL(url)
    expect(`${parsed.origin}${parsed.pathname}`).toBe("https://player.mediadelivery.net/embed/759/video-guid")
    expect(parsed.searchParams.get("token")).toBe(sha256(`token-keyvideo-guid${expires}`))
    expect(parsed.searchParams.get("expires")).toBe(String(expires))
    expect(parsed.searchParams.get("preload")).toBe("false")
  })

  it("accepts only webhooks signed with the read-only key (v1, hmac-sha256)", () => {
    const body = JSON.stringify({ VideoLibraryId: 759, VideoGuid: "video-guid", Status: 3 })
    const signature = crypto.createHmac("sha256", "read-only-key").update(body, "utf8").digest("hex")
    const headers = (sig: string, version = "v1", algorithm = "hmac-sha256") =>
      new Headers({ "x-bunnystream-signature": sig, "x-bunnystream-signature-version": version, "x-bunnystream-signature-algorithm": algorithm })
    expect(verifyBunnyWebhook(body, headers(signature))).toBe(true)
    expect(verifyBunnyWebhook(body + " ", headers(signature))).toBe(false)
    expect(verifyBunnyWebhook(body, headers(signature.replace(/.$/, "0")))).toBe(signature.endsWith("0"))
    expect(verifyBunnyWebhook(body, headers(signature, "v2"))).toBe(false)
    expect(verifyBunnyWebhook(body, headers("not-hex"))).toBe(false)
  })

  it("maps Bunny's video status to the lesson asset's", () => {
    expect(bunnyVideoState({ status: BUNNY_VIDEO_STATUS.finished, availableResolutions: "720p" })).toBe("ready")
    expect(bunnyVideoState({ status: BUNNY_VIDEO_STATUS.transcoding, availableResolutions: "360p" })).toBe("ready")
    expect(bunnyVideoState({ status: BUNNY_VIDEO_STATUS.transcoding, availableResolutions: "" })).toBe("pending")
    expect(bunnyVideoState({ status: BUNNY_VIDEO_STATUS.created, availableResolutions: null })).toBe("pending")
    expect(bunnyVideoState({ status: BUNNY_VIDEO_STATUS.error, availableResolutions: null })).toBe("failed")
    expect(bunnyVideoState({ status: BUNNY_VIDEO_STATUS.uploadFailed, availableResolutions: null })).toBe("failed")
  })
})
