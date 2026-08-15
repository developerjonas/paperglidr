"use client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { CheckIcon, DownloadIcon, Loader2Icon } from "lucide-react";
import { useState } from "react";

export function CertificateDownloadButton({
  elementId,
  fileName,
}: {
  elementId: string;
  fileName: string;
}) {
  const [status, setStatus] = useState<"idle" | "downloading" | "done">("idle");
  const { toast } = useToast();

  async function handleDownload() {
    setStatus("downloading");
    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import("html2canvas"),
        import("jspdf"),
      ]);

      const node = document.getElementById(elementId);
      if (node == null) {
        throw new Error("Certificate not found on page");
      }

      const canvas = await html2canvas(node, {
        scale: 2,
        backgroundColor: null,
        useCORS: true,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "px",
        format: [canvas.width, canvas.height],
      });
      pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
      pdf.save(fileName);

      setStatus("done");
      toast({
        title: "Certificate downloaded",
        description: `Saved as ${fileName}`,
      });
      setTimeout(() => setStatus("idle"), 2000);
    } catch (error) {
      setStatus("idle");
      toast({
        variant: "destructive",
        title: "Download failed",
        description:
          error instanceof Error
            ? error.message
            : "Something went wrong generating your PDF. Please try again.",
      });
    }
  }

  return (
    <Button
      onClick={handleDownload}
      disabled={status === "downloading"}
      className="gap-2 rounded-[5px]"
    >
      {status === "downloading" ? (
        <>
          <Loader2Icon className="size-4 animate-spin" />
          Preparing PDF...
        </>
      ) : status === "done" ? (
        <>
          <CheckIcon className="size-4" />
          Downloaded
        </>
      ) : (
        <>
          <DownloadIcon className="size-4" />
          Download PDF
        </>
      )}
    </Button>
  );
}
