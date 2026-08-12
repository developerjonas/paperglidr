"use client"

import { useEffect, useState } from "react"

type DeliverResponse =
  | { type: "inline" | "download"; url: string }
  | { error: string }

function deliverUrl(lessonId: string, assetId: string) {
  return `/api/lessons/${lessonId}/assets/${assetId}/deliver`
}

export function VideoLessonViewer({
  lessonId,
  assetId,
  onFinishedVideo,
}: {
  lessonId: string
  assetId: string
  onFinishedVideo?: () => void
}) {
  const [url, setUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const res = await fetch(deliverUrl(lessonId, assetId))
        const data: DeliverResponse = await res.json()
        if ("error" in data) throw new Error(data.error)
        if (!cancelled) setUrl(data.url)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load video")
        }
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [lessonId, assetId])

  if (error) {
    return (
      <div className="flex items-center justify-center h-full w-full bg-muted rounded-md text-sm text-muted-foreground p-4 text-center">
        {error}
      </div>
    )
  }

  if (url == null) {
    return (
      <div className="flex items-center justify-center h-full w-full bg-muted rounded-md text-sm text-muted-foreground">
        Loading video…
      </div>
    )
  }

  return (
    // eslint-disable-next-line jsx-a11y/media-has-caption
    <video
      src={url}
      controls
      className="h-full w-full rounded-md bg-black"
      onEnded={onFinishedVideo}
    />
  )
}
