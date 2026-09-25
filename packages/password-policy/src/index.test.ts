import { describe, expect, it } from "vitest"
import { checkPassword, generateStrongPassword } from "./index"

const failures = (password: string, context = {}) =>
  checkPassword(password, context).checks.filter(c => !c.ok).map(c => c.id)

describe("checkPassword", () => {
  it("accepts a long random password with every character class", () => {
    expect(checkPassword("Tq7#vRm2!xWp9$Lk").ok).toBe(true)
  })

  it("names each missing rule", () => {
    expect(failures("short")).toEqual(expect.arrayContaining(["length", "upper", "digit", "symbol"]))
    expect(failures("alllowercase9#long")).toContain("upper")
    expect(failures("ALLUPPERCASE9#LONG")).toContain("lower")
  })

  it("rejects common words, repeats and runs however they're decorated", () => {
    expect(failures("MyPassword#2026x")).toContain("pattern")
    expect(failures("Xk#9aaaQwmr2Lp")).toContain("pattern")
    expect(failures("Xk#9abcdQwr2Lp")).toContain("pattern")
    expect(failures("Xk#96789Qwr2Lp")).toContain("pattern")
    expect(failures("Chiyali!Tq7vRm2")).toContain("pattern")
  })

  it("rejects the user's own name, username or email", () => {
    const context = { name: "Sita Sharma", username: "sita_s", email: "sitas@example.com" }
    expect(failures("Sharma#Tq7vRm2x", context)).toContain("personal")
    expect(failures("Tq7#vRm2sita_sX", context)).toContain("personal")
    expect(failures("Tq7#SITASvRm2x", context)).toContain("personal")
    expect(failures("Tq7#vRm2!xWp9$Lk", context)).not.toContain("personal")
  })

  it("only scores a password that passes every rule as strong", () => {
    expect(checkPassword("aaaaaaaaaaaaaaaaaaaa").score).toBeLessThan(3)
    expect(checkPassword("Tq7#vRm2!xWp").score).toBe(3)
    expect(checkPassword("Tq7#vRm2!xWp9$Lk").score).toBe(4)
  })
})

describe("generateStrongPassword", () => {
  it("always passes the rules, including the user's own context", () => {
    const context = { name: "Sita Sharma", username: "sita_s", email: "sitas@example.com" }
    for (let i = 0; i < 500; i++) {
      const password = generateStrongPassword(20, context)
      expect(password).toHaveLength(20)
      expect(checkPassword(password, context).ok).toBe(true)
    }
  })
})
