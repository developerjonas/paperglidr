"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { DownloadIcon } from "lucide-react"

type DeliverResponse =
  | { type: "inline" | "download"; url: string }
  | { error: string }

/**
 * Fetches a fresh signed URL from the delivery route right before use —
 * per Section 4 these are short-lived and regenerated per request, never
 * cached — then triggers a real browser download via a throwaway <a> tag.
 */
export function AssetDownloadButton({
  lessonId,
  assetId,
  fileName,
  label = "Download",
  variant = "default",
}: {
  lessonId: string
  assetId: string
  fileName?: string | null
  label?: string
  variant?: "default" | "outline" | "ghost" | "link"
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleDownload() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(
        `/api/lessons/${lessonId}/assets/${assetId}/deliver`
      )
      const data: DeliverResponse = await res.json()
      if ("error" in data) throw new Error(data.error)

      const a = document.createElement("a")
      a.href = data.url
      a.download = fileName ?? "download"
      document.body.appendChild(a)
      a.click()
      a.remove()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Download failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <Button variant={variant} onClick={handleDownload} disabled={loading}>
        <DownloadIcon className="mr-2 size-4" />
        {loading ? "Preparing…" : label}
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
