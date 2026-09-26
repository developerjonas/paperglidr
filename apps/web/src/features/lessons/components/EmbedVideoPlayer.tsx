"use client"

import { useEffect, useRef } from "react"
import YouTube from "react-youtube"
import { buildEmbedUrl, type Embed } from "@repo/video-embeds"

/**
 * A free-tier lesson's YouTube or Vimeo video. Calls onFinishedVideo when
 * it ends (YouTube IFrame API "ended" / Vimeo Player "ended"), so watching
 * to the end marks the lesson complete like hosted video does.
 */
export function EmbedVideoPlayer({ embed, onFinishedVideo }: { embed: Embed; onFinishedVideo?: () => void }) {
  if (embed.provider === "youtube") {
    return (
      <YouTube
        videoId={embed.videoId}
        className="w-full h-full"
        opts={{
          width: "100%",
          height: "100%",
          host: "https://www.youtube-nocookie.com",
          playerVars: { rel: 0, ...(embed.startSeconds ? { start: embed.startSeconds } : {}) },
        }}
        onEnd={onFinishedVideo}
      />
    )
  }
  return <VimeoPlayer embed={embed} onFinishedVideo={onFinishedVideo} />
}

function VimeoPlayer({ embed, onFinishedVideo }: { embed: Embed; onFinishedVideo?: () => void }) {
  const iframe = useRef<HTMLIFrameElement>(null)
  const onEnd = useRef(onFinishedVideo)
  useEffect(() => {
    onEnd.current = onFinishedVideo
  }, [onFinishedVideo])

  useEffect(() => {
    if (iframe.current == null) return
    let cancelled = false
    let destroy: (() => void) | undefined
    // Loaded on demand: most lessons never show a Vimeo video.
    void import("@vimeo/player").then(({ default: Player }) => {
      if (cancelled || iframe.current == null) return
      const player = new Player(iframe.current)
      player.on("ended", () => onEnd.current?.())
      destroy = () => void player.off("ended")
    })
    return () => {
      cancelled = true
      destroy?.()
    }
  }, [embed.videoId])

  return (
    <iframe
      ref={iframe}
      src={buildEmbedUrl(embed)}
      title="Lesson video"
      className="w-full h-full"
      allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
      allowFullScreen
      referrerPolicy="strict-origin-when-cross-origin"
    />
  )
}
