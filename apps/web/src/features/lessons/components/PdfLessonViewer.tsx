"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"
import type { PDFDocumentProxy } from "pdfjs-dist"
import { AssetDownloadButton } from "./AssetDownloadButton"

type DeliverResponse =
  | { type: "inline" | "download"; url: string }
  | { error: string }

function deliverUrl(lessonId: string, assetId: string) {
  return `/api/lessons/${lessonId}/assets/${assetId}/deliver`
}

export function PdfLessonViewer({
  lessonId,
  assetId,
  downloadable,
  fileName,
}: {
  lessonId: string
  assetId: string
  downloadable: boolean
  fileName?: string | null
}) {
  // Two entirely different UIs per Section 4 of the handoff doc — inline
  // PDF.js viewer for read-only preview, plain download button for the
  // downloadable case (the actual ICP use case). Not the same component
  // with a toggle, since the downloadable path deliberately has no viewer.
  if (downloadable) {
    return (
      <div className="flex items-center justify-center h-full w-full bg-muted rounded-md">
        <AssetDownloadButton
          lessonId={lessonId}
          assetId={assetId}
          fileName={fileName ?? "download.pdf"}
          label="Download PDF"
        />
      </div>
    )
  }
  return <PdfInlineViewer lessonId={lessonId} assetId={assetId} />
}

function PdfInlineViewer({
  lessonId,
  assetId,
}: {
  lessonId: string
  assetId: string
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null)
  const [pageNum, setPageNum] = useState(1)
  const [numPages, setNumPages] = useState(0)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const res = await fetch(deliverUrl(lessonId, assetId))
        const data: DeliverResponse = await res.json()
        if ("error" in data) throw new Error(data.error)

        // pdfjs-dist touches canvas/DOM APIs that don't exist server-side —
        // dynamic import keeps it out of the server bundle entirely.
        const pdfjsLib = await import("pdfjs-dist")
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`

        const doc = await pdfjsLib.getDocument({ url: data.url }).promise
        if (cancelled) return
        setPdfDoc(doc)
        setNumPages(doc.numPages)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load PDF")
        }
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [lessonId, assetId])

  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return
    const doc = pdfDoc // narrow once here — TS doesn't carry the null-check
    // narrowing on `pdfDoc` into the nested async function below.
    let cancelled = false

    async function render() {
      const page = await doc.getPage(pageNum)
      if (cancelled) return
      const viewport = page.getViewport({ scale: 1.4 })
      const canvas = canvasRef.current!
      const context = canvas.getContext("2d")!
      canvas.width = viewport.width
      canvas.height = viewport.height
      // newer pdfjs-dist RenderParameters requires `canvas` alongside
      // `canvasContext`, not just the 2D context on its own.
      await page.render({ canvas, canvasContext: context, viewport }).promise
    }

    render()
    return () => {
      cancelled = true
    }
  }, [pdfDoc, pageNum])

  if (error) {
    return (
      <div className="flex items-center justify-center h-full w-full bg-muted rounded-md text-sm text-muted-foreground p-4 text-center">
        {error}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 items-center h-full w-full overflow-auto bg-muted rounded-md p-4">
      <canvas ref={canvasRef} className="shadow-md max-w-full" />
      {numPages > 0 && (
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            disabled={pageNum <= 1}
            onClick={() => setPageNum(p => p - 1)}
          >
            <ChevronLeftIcon className="size-4" />
          </Button>
          <span className="text-sm">
            Page {pageNum} of {numPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={pageNum >= numPages}
            onClick={() => setPageNum(p => p + 1)}
          >
            <ChevronRightIcon className="size-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
