import { readdirSync, readFileSync, statSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"

// The stub gateway (src/test/stubGateway.ts) must be unreachable from the
// running app: no application file may import anything from src/test.
const srcRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap(entry => {
    const full = path.join(dir, entry)
    if (statSync(full).isDirectory()) return entry === "test" && dir === srcRoot ? [] : sourceFiles(full)
    return /\.(ts|tsx|mts|js|mjs)$/.test(entry) && !/\.test\.tsx?$/.test(entry) ? [full] : []
  })
}

describe("test code isolation", () => {
  it("no application file imports from src/test", () => {
    const offenders = sourceFiles(srcRoot).filter(file =>
      /from\s+["'](@\/test\/|\.{1,2}\/(\.\.\/)*test\/)|import\(["']@\/test\//.test(readFileSync(file, "utf8")),
    )
    expect(offenders).toEqual([])
  })

  it("the stub gateway is not an env-selectable gateway", () => {
    const config = readFileSync(path.join(srcRoot, "services/payments/config.ts"), "utf8")
    const gateways = readFileSync(path.join(srcRoot, "services/payments/gateways.ts"), "utf8")
    expect(config).toMatch(/GATEWAY_NAMES = \["esewa", "khalti", "fonepay"\] as const/)
    expect(gateways).not.toMatch(/stub/i)
  })
})
