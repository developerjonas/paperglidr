"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { actionToast } from "@/hooks/use-toast"
import { approvePayout, denyPayout } from "../actions/payouts"

export function PayoutRowActions({ payoutId }: { payoutId: string }) {
  const [rejecting, setRejecting] = useState(false)
  const [reason, setReason] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleApprove() {
    setLoading(true)
    const data = await approvePayout(payoutId)
    actionToast({ actionData: data })
    setLoading(false)
  }

  async function handleReject() {
    if (!reason.trim()) return
    setLoading(true)
    const data = await denyPayout(payoutId, reason)
    actionToast({ actionData: data })
    setLoading(false)
  }

  if (rejecting) {
    return (
      <div className="flex flex-col gap-2 min-w-64">
        <Input
          placeholder="Reason for rejection"
          value={reason}
          onChange={e => setReason(e.target.value)}
          disabled={loading}
        />
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="destructive"
            onClick={handleReject}
            disabled={loading || !reason.trim()}
          >
            Confirm Reject
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setRejecting(false)}
            disabled={loading}
          >
            Cancel
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex gap-2">
      <Button size="sm" onClick={handleApprove} disabled={loading}>
        Approve
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={() => setRejecting(true)}
        disabled={loading}
      >
        Reject
      </Button>
    </div>
  )
}
