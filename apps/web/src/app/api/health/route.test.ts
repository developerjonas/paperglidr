import { sql } from "drizzle-orm"
import { describe, expect, it } from "vitest"
import { db } from "@/drizzle/db"
import { GET, HEAD } from "./route"

// The uptime endpoint: green when the database answers and its schema
// matches the code, red (503) on a missing migration — the outage where
// production lacked columns the code selected.

describe("GET /api/health", () => {
  it("200 ok, uncached, with nothing sensitive in the body", async () => {
    const res = await GET()
    expect(res.status).toBe(200)
    expect(res.headers.get("cache-control")).toContain("no-store")
    const body = await res.json()
    expect(body).toMatchObject({ status: "ok", checks: { database: "ok", schema: "ok" } })
    expect(Object.keys(body).sort()).toEqual(["checks", "commit", "region", "responseMs", "status"])
  })

  it("503 when a column the code uses is missing, then healthy again once it's back", async () => {
    await db.execute(sql`alter table lesson_assets rename column "startSeconds" to "startSeconds_gone"`)
    try {
      const res = await GET()
      expect(res.status).toBe(503)
      const body = await res.json()
      expect(body).toMatchObject({ status: "fail", checks: { database: "ok", schema: "fail" } })
      expect(JSON.stringify(body)).not.toMatch(/startSeconds|column|does not exist/)
    } finally {
      await db.execute(sql`alter table lesson_assets rename column "startSeconds_gone" to "startSeconds"`)
    }
    expect((await GET()).status).toBe(200)
  })

  it("HEAD answers with the same status and no body", async () => {
    const res = await HEAD()
    expect(res.status).toBe(200)
    expect(await res.text()).toBe("")
  })
})
