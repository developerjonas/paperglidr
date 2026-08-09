"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { actionToast } from "@/hooks/use-toast"
import {
  requestLessonAssetUploadUrl,
  removeLessonAsset,
  listLessonAssetsForEditor,
} from "../actions/lessonAssets"

// Matches the shape returned by getLessonAssetsForLesson (db/lessonAssets.ts) —
// keep in sync if that query's columns change.
type LessonAsset = {
  id: string
  type: string
  provider: string
  role: "primary" | "attachment"
  fileName: string | null
  downloadable: boolean
}

export function LessonAssetManager({ lessonId }: { lessonId: string }) {
  const [assets, setAssets] = useState<LessonAsset[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)

  async function refresh() {
    setLoading(true)
    const data = await listLessonAssetsForEditor(lessonId)
    setAssets(data as LessonAsset[])
    setLoading(false)
  }

  useEffect(() => {
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonId])

  async function handleUpload(
    file: File,
    role: "primary" | "attachment",
    downloadable: boolean
  ) {
    setUploading(true)
    try {
      const { uploadUrl } = await requestLessonAssetUploadUrl({
        lessonId,
        fileName: file.name,
        mimeType: file.type,
        fileSizeBytes: file.size,
        role,
        downloadable,
      })

      const putRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      })
      if (!putRes.ok) throw new Error("Upload to storage failed")

      actionToast({ actionData: { error: false, message: "Uploaded" } })
      await refresh()
    } catch (err) {
      actionToast({
        actionData: {
          error: true,
          message: err instanceof Error ? err.message : "Upload failed",
        },
      })
    } finally {
      setUploading(false)
    }
  }

  async function handleRemove(assetId: string) {
    const data = await removeLessonAsset(assetId, lessonId)
    actionToast({
      actionData: { error: data == null, message: data == null ? "Failed to remove" : "Removed" },
    })
    await refresh()
  }

  return (
    <div className="flex flex-col gap-4 border rounded-md p-4">
      <div>
        <h3 className="font-medium">Lesson content</h3>
        <p className="text-sm text-muted-foreground">
          Upload the main PDF or video for this lesson, and optionally attach
          extra downloadable files (slides, worksheets).
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading assets…</p>
      ) : assets.length === 0 ? (
        <p className="text-sm text-muted-foreground">No content uploaded yet.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {assets.map(asset => (
            <li
              key={asset.id}
              className="flex items-center justify-between text-sm border rounded px-3 py-2"
            >
              <span>
                <strong>{asset.role}</strong> · {asset.type} ·{" "}
                {asset.fileName ?? "(unnamed)"}
                {asset.downloadable ? " · downloadable" : ""}
              </span>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => handleRemove(asset.id)}
              >
                Remove
              </Button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">
          Upload primary content (PDF or video)
        </label>
        <Input
          type="file"
          accept="application/pdf,video/*"
          disabled={uploading}
          onChange={e => {
            const file = e.target.files?.[0]
            if (file) handleUpload(file, "primary", false)
            e.target.value = ""
          }}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">
          Add downloadable attachment (optional)
        </label>
        <Input
          type="file"
          disabled={uploading}
          onChange={e => {
            const file = e.target.files?.[0]
            if (file) handleUpload(file, "attachment", true)
            e.target.value = ""
          }}
        />
      </div>
    </div>
  )
}
