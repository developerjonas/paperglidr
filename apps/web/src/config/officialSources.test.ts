import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"
import { NOT_GOVERNMENT_DISCLAIMER, OFFICIAL_SOURCES } from "./officialSources"

// The app ships its own copy (shown offline, before /api/v1/config loads).
const appCopy = readFileSync(new URL("../../../mobile/src/constants/official-info.ts", import.meta.url), "utf8")

describe("not-a-government-app notice (Google Play Misleading Claims)", () => {
  it("the app's bundled disclaimer matches the server's", () => {
    const quoted = appCopy.match(/NOT_GOVERNMENT_DISCLAIMER =([\s\S]*?);\n/)![1]!
    const text = [...quoted.matchAll(/'([^']*)'/g)].map(m => m[1]).join("")
    expect(text).toBe(NOT_GOVERNMENT_DISCLAIMER)
    expect(NOT_GOVERNMENT_DISCLAIMER).not.toContain("..")
  })

  it("the app lists the same official sources, all https", () => {
    for (const source of OFFICIAL_SOURCES) {
      expect(source.url).toMatch(/^https:\/\//)
      for (const value of Object.values(source)) expect(appCopy).toContain(`'${value}'`)
    }
  })
})
