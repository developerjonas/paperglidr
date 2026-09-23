"use client"

import { useState } from "react"
import Image from "next/image"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { confirmImageUpload, requestImageUploadUrl } from "../actions/imageUploads"
import {
  IMAGE_MAX_BYTES,
  IMAGE_MIME_TYPES,
  IMAGE_RULES_TEXT,
  isImageMimeType,
  type ImageUploadPurpose,
} from "../lib/imageUploadRules"

/**
 * File picker that uploads to R2 and reports the public URL through
 * onChange. The URL is what the form saves; there is no URL text box.
 */
export function ImageUploadField({
  purpose,
  value,
  onChange,
  previewClassName,
}: {
  purpose: ImageUploadPurpose
  value: string
  onChange: (url: string) => void
  previewClassName?: string
}) {
  const [status, setStatus] = useState<"idle" | "uploading">("idle")
  const [error, setError] = useState<string | null>(null)

  async function upload(file: File) {
    setError(null)
    if (!isImageMimeType(file.type) || file.size > IMAGE_MAX_BYTES) {
      setError(`Images must be ${IMAGE_RULES_TEXT}`)
      return
    }

    setStatus("uploading")
    try {
      const requested = await requestImageUploadUrl({
        purpose,
        mimeType: file.type,
        fileSizeBytes: file.size,
      })
      if (requested.error) throw new Error(requested.message)

      const put = await fetch(requested.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      })
      if (!put.ok) throw new Error("Upload to storage failed. Please try again.")

      const confirmed = await confirmImageUpload({
        purpose,
        stagingKey: requested.stagingKey,
      })
      if (confirmed.error) throw new Error(confirmed.message)
      onChange(confirmed.url)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed")
    } finally {
      setStatus("idle")
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {value && (
        <div
          className={cn(
            "relative aspect-video w-48 overflow-hidden rounded-md border",
            previewClassName,
          )}
        >
          <Image src={value} alt="" fill sizes="192px" className="object-cover" />
        </div>
      )}
      <Input
        type="file"
        accept={IMAGE_MIME_TYPES.join(",")}
        disabled={status === "uploading"}
        onChange={e => {
          const file = e.target.files?.[0]
          if (file) void upload(file)
          e.target.value = ""
        }}
      />
      <p className="text-sm text-muted-foreground">
        {status === "uploading" ? "Uploading…" : IMAGE_RULES_TEXT}
      </p>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
