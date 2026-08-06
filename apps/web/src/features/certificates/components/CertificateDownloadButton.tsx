"use client"
import { Button } from "@/components/ui/button"
import { DownloadIcon } from "lucide-react"
import { useState } from "react"

export function CertificateDownloadButton({
  elementId,
  fileName,
}: {
  elementId: string
  fileName: string
}) {
  const [isDownloading, setIsDownloading] = useState(false)

  async function handleDownload() {
    setIsDownloading(true)
    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import("html2canvas"),
        import("jspdf"),
      ])
      const node = document.getElementById(elementId)
      if (node == null) return
      const canvas = await html2canvas(node, { scale: 2, backgroundColor: null })
      const imgData = canvas.toDataURL("image/png")
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "px",
        format: [canvas.width, canvas.height],
      })
      pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height)
      pdf.save(fileName)
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <Button onClick={handleDownload} disabled={isDownloading}>
      <DownloadIcon className="mr-2 size-4" />
      {isDownloading ? "Preparing..." : "Download PDF"}
    </Button>
  )
}
