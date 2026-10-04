import { describe, expect, it, vi } from "vitest"

// The app can't resolve site-relative image paths, so the API sends them absolute.

vi.mock("@/lib/auth", () => ({ auth: { api: { getSession: async () => null } } }))
vi.mock("next/headers", () => ({ headers: async () => new Headers(), cookies: async () => ({ get: () => undefined }) }))

const { apiJson } = await import("./v1")
const { SITE_URL } = await import("@/lib/site")

describe("apiJson", () => {
  it("makes site-relative image fields absolute, at any depth, and leaves everything else alone", async () => {
    const res = apiJson({
      imageUrl: "/courses/php.png",
      instructor: { profileImageUrl: "/x.png", name: "/not-an-image" },
      list: [{ imageUrl: "https://images.chiyali.com/a.png" }, { image: "//cdn.example/x.png" }, { image: null }],
      path: "/keep",
    })
    expect(res.headers.get("content-type")).toContain("application/json")
    expect(res.headers.get("cache-control")).toBe("private, no-store")
    expect(await res.json()).toEqual({
      imageUrl: `${SITE_URL}/courses/php.png`,
      instructor: { profileImageUrl: `${SITE_URL}/x.png`, name: "/not-an-image" },
      list: [{ imageUrl: "https://images.chiyali.com/a.png" }, { image: "//cdn.example/x.png" }, { image: null }],
      path: "/keep",
    })
  })

  it("keeps the status", () => {
    expect(apiJson({ message: "nope" }, 404).status).toBe(404)
  })
})
