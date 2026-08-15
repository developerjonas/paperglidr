"use client";
import { useEffect, useState } from "react";

type DeliverResponse =
  | { type: "inline" | "download"; url: string }
  | { type: "bunny_embed"; url: string }
  | { error: string };

// The error variant never actually reaches state — it's caught and thrown
// in load() before setData runs — so state only needs the success shapes.
type LoadedVideo = Exclude<DeliverResponse, { error: string }>;

function deliverUrl(lessonId: string, assetId: string) {
  return `/api/lessons/${lessonId}/assets/${assetId}/deliver`;
}

export function VideoLessonViewer({
  lessonId,
  assetId,
  onFinishedVideo,
}: {
  lessonId: string;
  assetId: string;
  onFinishedVideo?: () => void;
}) {
  const [data, setData] = useState<LoadedVideo | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(deliverUrl(lessonId, assetId));
        const json: DeliverResponse = await res.json();
        if ("error" in json) throw new Error(json.error);
        if (!cancelled) setData(json);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load video");
        }
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [lessonId, assetId]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-full w-full bg-muted rounded-md text-sm text-muted-foreground p-4 text-center">
        {error}
      </div>
    );
  }

  if (data == null) {
    return (
      <div className="flex items-center justify-center h-full w-full bg-muted rounded-md text-sm text-muted-foreground">
        Loading video…
      </div>
    );
  }

  if (data.type === "bunny_embed") {
    return (
      <iframe
        src={data.url}
        className="h-full w-full rounded-md bg-black"
        allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
        allowFullScreen
      />
    );
  }

  return (
    <video
      src={data.url}
      controls
      className="h-full w-full rounded-md bg-black"
      onEnded={onFinishedVideo}
    />
  );
}
