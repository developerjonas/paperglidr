import { describe, expect, it } from "vitest"
import { POLICY_TERMS } from "@/config/policyTerms"
import { SAVED_REPLIES, fillSavedReply } from "./savedReplies"

// Saved support replies: personalised, and quoting the numbers the code
// actually enforces.

describe("saved replies", () => {
  const byId = (id: string) => SAVED_REPLIES.find((r) => r.id === id)!

  it("greets by first name, or 'there' when unknown or deleted", () => {
    expect(fillSavedReply(byId("certificate"), "Sita Sharma")).toMatch(/^Hi Sita,/)
    expect(fillSavedReply(byId("certificate"), null)).toMatch(/^Hi there,/)
    expect(fillSavedReply(byId("certificate"), "Deleted user")).toMatch(/^Hi there,/)
    expect(fillSavedReply(byId("certificate"), "Sita")).not.toContain("{name}")
  })

  it("quotes the refund and payout rules from POLICY_TERMS", () => {
    expect(byId("refund-how").body).toContain(`${POLICY_TERMS.refundWindowDays} days`)
    expect(byId("refund-how").body).toContain(`${POLICY_TERMS.refundCompletionThresholdPercent}%`)
    expect(byId("creator-payout").body).toContain(POLICY_TERMS.minimumPayout)
  })

  it("has unique ids and covers the two most common tickets", () => {
    expect(new Set(SAVED_REPLIES.map((r) => r.id)).size).toBe(SAVED_REPLIES.length)
    expect(SAVED_REPLIES.map((r) => r.id)).toEqual(expect.arrayContaining(["paid-no-access", "video-wont-play"]))
  })
})
