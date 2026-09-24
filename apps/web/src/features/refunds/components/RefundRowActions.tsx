"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { actionToast } from "@/hooks/use-toast"
import { approveRefund, rejectRefund } from "../actions/refunds"

export function RefundRowActions({ requestId }: { requestId: string }) {
  const [rejecting, setRejecting] = useState(false)
  const [reason, setReason] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleApprove() {
    if (!confirm("Approve this refund? This removes the buyer's access and reverses the creator's earnings. You then return the money in the gateway dashboard.")) return
    setLoading(true)
    actionToast({ actionData: await approveRefund(requestId) })
    setLoading(false)
  }

  async function handleReject() {
    if (!reason.trim()) return
    setLoading(true)
    actionToast({ actionData: await rejectRefund(requestId, reason) })
    setLoading(false)
  }

  if (rejecting) {
    return (
      <div className="flex min-w-64 flex-col gap-2">
        <Input
          placeholder="Reason (emailed to the buyer)"
          value={reason}
          onChange={e => setReason(e.target.value)}
          disabled={loading}
        />
        <div className="flex gap-2">
          <Button size="sm" variant="destructive" onClick={handleReject} disabled={loading || !reason.trim()}>
            Confirm reject
          </Button>
          <Button size="sm" variant="outline" onClick={() => setRejecting(false)} disabled={loading}>
            Cancel
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex gap-2">
      <Button size="sm" onClick={handleApprove} disabled={loading}>
        Approve &amp; revoke
      </Button>
      <Button size="sm" variant="outline" onClick={() => setRejecting(true)} disabled={loading}>
        Reject
      </Button>
    </div>
  )
}
