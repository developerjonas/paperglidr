import { describe, expect, it } from "vitest"
import { buildEmbedUrl, fromStoredEmbed, normalizeEmbedUrl, parseEmbedUrl, parseStartTime, toStoredEmbed } from "./index"

const ID = "dQw4w9WgXcQ"
const YT = `https://www.youtube-nocookie.com/embed/${ID}`

describe("normalizeEmbedUrl — YouTube", () => {
  it.each([
    `https://www.youtube.com/watch?v=${ID}`,
    `https://youtube.com/watch?v=${ID}`,
    `https://m.youtube.com/watch?v=${ID}`,
    `http://www.youtube.com/watch?v=${ID}`,
    `https://youtu.be/${ID}`,
    `https://www.youtube.com/shorts/${ID}`,
    `https://www.youtube.com/embed/${ID}`,
    `https://www.youtube.com/live/${ID}`,
    `https://www.youtube-nocookie.com/embed/${ID}`,
    `  https://youtu.be/${ID}  `,
  ])("%s", link => {
    expect(normalizeEmbedUrl(link)).toBe(YT)
  })

  it("strips tracking and playlist params", () => {
    expect(normalizeEmbedUrl(`https://www.youtube.com/watch?v=${ID}&list=PL123&index=2&feature=share&si=abc&utm_source=x`)).toBe(YT)
    expect(normalizeEmbedUrl(`https://youtu.be/${ID}?si=trackingtoken`)).toBe(YT)
  })

  it("keeps the start time in every form", () => {
    expect(normalizeEmbedUrl(`https://youtu.be/${ID}?t=90`)).toBe(`${YT}?start=90`)
    expect(normalizeEmbedUrl(`https://www.youtube.com/watch?v=${ID}&t=1m30s`)).toBe(`${YT}?start=90`)
    expect(normalizeEmbedUrl(`https://www.youtube.com/embed/${ID}?start=42&autoplay=1`)).toBe(`${YT}?start=42`)
    expect(normalizeEmbedUrl(`https://www.youtube.com/watch?v=${ID}#t=1h`)).toBe(`${YT}?start=3600`)
  })

  it("rejects malformed IDs and other YouTube pages", () => {
    expect(normalizeEmbedUrl("https://www.youtube.com/watch?v=short")).toBeNull()
    expect(normalizeEmbedUrl("https://www.youtube.com/@somechannel")).toBeNull()
    expect(normalizeEmbedUrl("https://www.youtube.com/playlist?list=PL123")).toBeNull()
    expect(normalizeEmbedUrl(`https://youtu.be/${ID}extra`)).toBeNull()
  })
})

describe("normalizeEmbedUrl — Vimeo", () => {
  it.each([
    "https://vimeo.com/76979871",
    "https://www.vimeo.com/76979871",
    "https://player.vimeo.com/video/76979871",
    "https://vimeo.com/channels/staffpicks/76979871",
    "https://vimeo.com/groups/shortfilms/videos/76979871",
    "https://vimeo.com/76979871?share=copy&utm_source=x",
  ])("%s", link => {
    expect(normalizeEmbedUrl(link)).toBe("https://player.vimeo.com/video/76979871")
  })

  it("keeps an unlisted video's hash, from either form", () => {
    expect(normalizeEmbedUrl("https://vimeo.com/76979871/abc123def0")).toBe("https://player.vimeo.com/video/76979871?h=abc123def0")
    expect(normalizeEmbedUrl("https://player.vimeo.com/video/76979871?h=abc123def0&badge=0")).toBe(
      "https://player.vimeo.com/video/76979871?h=abc123def0",
    )
  })

  it("keeps the start time", () => {
    expect(normalizeEmbedUrl("https://vimeo.com/76979871#t=90")).toBe("https://player.vimeo.com/video/76979871#t=90s")
    expect(normalizeEmbedUrl("https://vimeo.com/76979871#t=1m5s")).toBe("https://player.vimeo.com/video/76979871#t=65s")
  })

  it("rejects non-video Vimeo pages", () => {
    expect(normalizeEmbedUrl("https://vimeo.com/someuser")).toBeNull()
    expect(normalizeEmbedUrl("https://vimeo.com/showcase/123456")).toBeNull()
    expect(normalizeEmbedUrl("https://player.vimeo.com/76979871")).toBeNull()
    expect(normalizeEmbedUrl("https://vimeo.com/76979871/not-a-hash!")).toBeNull()
  })
})

describe("normalizeEmbedUrl — rejected", () => {
  it.each([
    "",
    "not a url",
    `javascript:alert(1)//https://youtu.be/${ID}`,
    "javascript:alert(document.cookie)",
    `data:text/html,<iframe src="https://youtu.be/${ID}">`,
    `file:///etc/passwd`,
    `ftp://youtube.com/watch?v=${ID}`,
    `https://evil.com/watch?v=${ID}`,
    `https://youtube.com.evil.com/watch?v=${ID}`,
    `https://evilyoutube.com/watch?v=${ID}`,
    `https://notvimeo.com/76979871`,
    `https://user:pass@youtube.com/watch?v=${ID}`,
    `https://youtube.com:8443/watch?v=${ID}`,
    `https://evil.com/?u=https://youtu.be/${ID}`,
    `https://example.com/video.mp4`,
    `//youtu.be/${ID}`,
  ])("%s", link => {
    expect(normalizeEmbedUrl(link)).toBeNull()
  })

  it("rejects absurdly long input", () => {
    expect(normalizeEmbedUrl(`https://youtu.be/${ID}?x=${"a".repeat(3000)}`)).toBeNull()
  })
})

describe("parseStartTime", () => {
  it("reads seconds and h/m/s", () => {
    expect(parseStartTime("75")).toBe(75)
    expect(parseStartTime("75s")).toBe(75)
    expect(parseStartTime("2m")).toBe(120)
    expect(parseStartTime("1h2m3s")).toBe(3723)
  })
  it("ignores zero, junk and absurd values", () => {
    expect(parseStartTime("0")).toBeUndefined()
    expect(parseStartTime("abc")).toBeUndefined()
    expect(parseStartTime("h")).toBeUndefined()
    expect(parseStartTime("999999")).toBeUndefined()
    expect(parseStartTime(null)).toBeUndefined()
  })
})

describe("stored form", () => {
  it("round-trips", () => {
    for (const link of [`https://youtu.be/${ID}?t=30`, "https://vimeo.com/76979871/abc123def0#t=12", "https://vimeo.com/76979871"]) {
      const embed = parseEmbedUrl(link)!
      const stored = toStoredEmbed(embed)
      expect(fromStoredEmbed(stored)).toEqual(embed)
      expect(buildEmbedUrl(fromStoredEmbed(stored)!)).toBe(normalizeEmbedUrl(link))
    }
  })
  it("refuses tampered or unknown stored values", () => {
    expect(fromStoredEmbed({ provider: "youtube", externalId: "<script>" })).toBeNull()
    expect(fromStoredEmbed({ provider: "vimeo", externalId: "123:../../x" })).toBeNull()
    expect(fromStoredEmbed({ provider: "r2", externalId: ID })).toBeNull()
    expect(fromStoredEmbed({ provider: "youtube", externalId: null })).toBeNull()
  })
})
