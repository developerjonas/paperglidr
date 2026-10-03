"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { YoutubeIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { actionToast } from "@/hooks/use-toast"
import { importPlaylist, previewPlaylistImport } from "../actions/playlistImport"
import type { CourseVideoState } from "./LessonAssetManager"

type Preview = {
  title: string
  channelTitle: string
  videoTitles: string[]
  skipped: number
  truncated: boolean
  maxVideos: number
}

/**
 * "Import YouTube playlist": paste a playlist link, see what it contains,
 * then create a section with one lesson per video. Free courses and
 * courses not on sale yet only; a paid course's lessons can't use links.
 */
export function ImportPlaylistDialog({ courseId, courseVideoState }: { courseId: string; courseVideoState: CourseVideoState }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [url, setUrl] = useState("")
  const [preview, setPreview] = useState<Preview | null>(null)
  const [sectionName, setSectionName] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const paid = courseVideoState === "paid"

  function reset() {
    setUrl("")
    setPreview(null)
    setSectionName("")
    setError(null)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) reset()
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline">
          <YoutubeIcon /> Import YouTube playlist
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Import a YouTube playlist</DialogTitle>
          <DialogDescription>
            Creates a new section with one lesson per video, in playlist order. Each lesson plays the YouTube video, so
            this is for free courses: a paid course needs uploaded videos (YouTube links work only on its free preview
            lessons).
          </DialogDescription>
        </DialogHeader>

        {paid ? (
          <p className="rounded-lg border border-border bg-secondary/50 p-3 text-sm">
            This course is sold as a paid course, so its lessons can&apos;t use YouTube links. Import the playlist into a
            free course, or a new one, instead.
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            <form
              className="flex gap-2"
              onSubmit={(event) => {
                event.preventDefault()
                setError(null)
                setPreview(null)
                startTransition(async () => {
                  const result = await previewPlaylistImport(courseId, url)
                  if (result.error) return setError(result.message)
                  setPreview(result)
                  setSectionName(result.title)
                })
              }}
            >
              <label htmlFor="playlist-url" className="sr-only">
                Playlist link
              </label>
              <Input
                id="playlist-url"
                placeholder="https://www.youtube.com/playlist?list=…"
                value={url}
                onChange={(event) => setUrl(event.target.value)}
                disabled={pending}
              />
              <Button type="submit" variant="outline" disabled={pending || !url.trim()}>
                {pending && !preview ? "Reading…" : "Preview"}
              </Button>
            </form>

            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}

            {preview && (
              <div className="flex flex-col gap-3">
                <div className="text-sm">
                  <p className="font-medium">{preview.title}</p>
                  <p className="text-muted-foreground">
                    {preview.channelTitle ? `${preview.channelTitle} · ` : ""}
                    {preview.videoTitles.length} video{preview.videoTitles.length === 1 ? "" : "s"}
                    {preview.skipped > 0 && ` · ${preview.skipped} private or deleted left out`}
                  </p>
                  {preview.truncated && (
                    <p className="text-muted-foreground">Only the first {preview.maxVideos} videos will be imported.</p>
                  )}
                </div>
                <ol className="max-h-48 list-decimal overflow-y-auto rounded-lg border border-border py-2 pl-8 pr-3 text-sm">
                  {preview.videoTitles.map((title, index) => (
                    <li key={index} className="py-0.5">
                      {title}
                    </li>
                  ))}
                </ol>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="playlist-section" className="text-sm font-medium">
                    Section name
                  </label>
                  <Input
                    id="playlist-section"
                    value={sectionName}
                    maxLength={120}
                    onChange={(event) => setSectionName(event.target.value)}
                    disabled={pending}
                  />
                </div>
                <Button
                  disabled={pending}
                  onClick={() =>
                    startTransition(async () => {
                      const result = await importPlaylist(courseId, url, sectionName)
                      actionToast({ actionData: result })
                      if (result.error) return
                      setOpen(false)
                      reset()
                      router.refresh()
                    })
                  }
                >
                  {pending
                    ? "Importing…"
                    : `Import ${preview.videoTitles.length} lesson${preview.videoTitles.length === 1 ? "" : "s"}`}
                </Button>
                <p className="text-xs text-muted-foreground">
                  You can rename, reorder, delete or add files to the lessons afterwards, like any other lesson.
                </p>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
