"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { actionToast } from "@/hooks/use-toast"
import { approveProductReview, rejectProductReview } from "../actions/moderation"

export function ProductReviewActions({ productId }: { productId: string }) {
  const [rejecting, setRejecting] = useState(false)
  const [reason, setReason] = useState("")
  const [loading, setLoading] = useState(false)

  async function run(action: () => Promise<{ error: boolean; message: string }>) {
    setLoading(true)
    actionToast({ actionData: await action() })
    setLoading(false)
  }

  if (rejecting) {
    return (
      <div className="flex min-w-64 flex-col gap-2">
        <Input
          placeholder="Reason (emailed to the creator)"
          value={reason}
          onChange={e => setReason(e.target.value)}
          disabled={loading}
        />
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="destructive"
            disabled={loading || !reason.trim()}
            onClick={() => run(() => rejectProductReview(productId, reason))}
          >
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
      <Button size="sm" disabled={loading} onClick={() => run(() => approveProductReview(productId))}>
        Approve
      </Button>
      <Button size="sm" variant="outline" disabled={loading} onClick={() => setRejecting(true)}>
        Reject
      </Button>
    </div>
  )
}
