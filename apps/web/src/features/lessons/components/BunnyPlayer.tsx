"use client";

import { useEffect, useRef, useState } from "react";
import { Maximize2, Minimize2 } from "lucide-react";

// Bunny Stream's player API (player.js), served by Bunny:
// https://docs.bunny.net/stream/playback-api.md
const PLAYERJS_SRC = "https://assets.mediadelivery.net/playerjs/playerjs-latest.min.js";

type PlayerJs = { Player: new (iframe: HTMLIFrameElement) => { on: (event: string, cb: () => void) => void } };
declare global {
  interface Window {
    playerjs?: PlayerJs;
  }
}

let playerjsLoading: Promise<PlayerJs> | null = null;
function loadPlayerJs(): Promise<PlayerJs> {
  if (window.playerjs) return Promise.resolve(window.playerjs);
  playerjsLoading ??= new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = PLAYERJS_SRC;
    script.async = true;
    script.onload = () => (window.playerjs ? resolve(window.playerjs) : reject(new Error("player.js missing")));
    script.onerror = () => {
      playerjsLoading = null;
      reject(new Error("player.js failed to load"));
    };
    document.head.appendChild(script);
  });
  return playerjsLoading;
}

/**
 * A paid lesson's video: Bunny's player in an iframe (the signed link comes
 * from the deliver route), with the viewer's name drifting across it so a
 * screen recording shows whose account it came from. Fullscreen is ours,
 * on the wrapper, so the watermark stays on screen; the iframe itself
 * isn't allowed to go fullscreen. player.js is loaded before the iframe
 * (Bunny's Next.js guide), then reports when the video ends.
 */
export function BunnyPlayer({
  url,
  watermark,
  onEnded,
}: {
  url: string;
  watermark: string;
  onEnded?: () => void;
}) {
  const wrapper = useRef<HTMLDivElement>(null);
  const [playerjs, setPlayerjs] = useState<PlayerJs | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const onEndedRef = useRef(onEnded);
  useEffect(() => {
    onEndedRef.current = onEnded;
  }, [onEnded]);

  useEffect(() => {
    let cancelled = false;
    loadPlayerJs()
      .then((pj) => !cancelled && setPlayerjs(pj))
      // Playback still works without it; only "lesson complete on end" is lost.
      .catch(() => !cancelled && setPlayerjs({ Player: class { on() {} } as unknown as PlayerJs["Player"] }));
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const onChange = () => setFullscreen(document.fullscreenElement === wrapper.current);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  function attach(iframe: HTMLIFrameElement | null) {
    if (iframe == null || playerjs == null) return;
    const player = new playerjs.Player(iframe);
    player.on("ready", () => player.on("ended", () => onEndedRef.current?.()));
  }

  function toggleFullscreen() {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void wrapper.current?.requestFullscreen();
  }

  return (
    <div
      ref={wrapper}
      className="relative h-full w-full overflow-hidden rounded-md bg-black"
      onContextMenu={(e) => e.preventDefault()}
    >
      {playerjs == null ? (
        <div className="flex h-full w-full items-center justify-center text-sm text-white/70">Loading video…</div>
      ) : (
        <iframe
          ref={attach}
          src={url}
          title="Lesson video"
          className="h-full w-full border-0"
          allow="autoplay; encrypted-media; picture-in-picture"
          referrerPolicy="strict-origin-when-cross-origin"
        />
      )}
      <Watermark text={watermark} />
      <button
        type="button"
        onClick={toggleFullscreen}
        aria-label={fullscreen ? "Exit full screen" : "Full screen"}
        className="absolute right-2 top-2 rounded-md bg-black/50 p-1.5 text-white/90 transition hover:bg-black/70"
      >
        {fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
      </button>
    </div>
  );
}

// Positions it drifts between (percent of the frame), away from the player's controls.
const SPOTS = [
  { top: 12, left: 8 },
  { top: 18, left: 55 },
  { top: 42, left: 30 },
  { top: 55, left: 62 },
  { top: 30, left: 12 },
  { top: 65, left: 18 },
];

/** The viewer's name and email, faint, moving every 8 seconds. Clicks pass through. */
export function Watermark({ text }: { text: string }) {
  const [spot, setSpot] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setSpot((i) => (i + 1 + Math.floor(Math.random() * (SPOTS.length - 1))) % SPOTS.length), 8000);
    return () => clearInterval(timer);
  }, []);
  const { top, left } = SPOTS[spot]!;
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute select-none whitespace-nowrap text-xs font-medium text-white/40 transition-all duration-1000 sm:text-sm"
      style={{ top: `${top}%`, left: `${left}%`, textShadow: "0 1px 2px rgba(0,0,0,0.6)" }}
    >
      {text}
    </div>
  );
}
