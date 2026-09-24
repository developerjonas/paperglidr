"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { actionToast } from "@/hooks/use-toast"
import { reviewReport } from "../actions/reports"

export function ReportRowActions({ reportId }: { reportId: string }) {
  const [note, setNote] = useState("")
  const [loading, setLoading] = useState(false)

  async function close(status: "dismissed" | "action_taken") {
    setLoading(true)
    actionToast({ actionData: await reviewReport({ reportId, status, note }) })
    setLoading(false)
  }

  return (
    <div className="flex min-w-64 flex-col gap-2">
      <Input
        placeholder="Note (optional, admins only)"
        value={note}
        onChange={e => setNote(e.target.value)}
        disabled={loading}
      />
      <div className="flex gap-2">
        <Button size="sm" onClick={() => close("action_taken")} disabled={loading}>
          Action taken
        </Button>
        <Button size="sm" variant="outline" onClick={() => close("dismissed")} disabled={loading}>
          Dismiss
        </Button>
      </div>
    </div>
  )
}
