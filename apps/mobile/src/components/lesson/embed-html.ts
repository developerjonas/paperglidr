import type { Embed } from '@repo/video-embeds';
import { buildEmbedUrl } from '@repo/video-embeds';

/** What the player page posts back (see embedPlayerHtml). */
export type EmbedPlayerMessage = { source: 'chiyali-embed'; type: 'ended' } | { source: 'chiyali-embed'; type: 'error'; code: string };

export function parseEmbedPlayerMessage(data: unknown): EmbedPlayerMessage | null {
  if (typeof data !== 'string') return null;
  try {
    const message = JSON.parse(data) as Partial<EmbedPlayerMessage>;
    return message.source === 'chiyali-embed' ? (message as EmbedPlayerMessage) : null;
  } catch {
    return null;
  }
}

// Safe inside <script>: no "</script>" or HTML comment can be formed.
const json = (value: unknown) => JSON.stringify(value).replace(/</g, '\\u003c');

/**
 * A tiny page that plays one YouTube or Vimeo video through the provider's
 * official player API and reports when it ends — shown in a WebView (iOS,
 * Android) or a srcdoc iframe (web). The embed comes from
 * @repo/video-embeds, so only an allowlisted provider and a validated ID
 * ever reach this page.
 */
export function embedPlayerHtml(embed: Embed) {
  const send = `function send(message) {
    var data = JSON.stringify(Object.assign({ source: 'chiyali-embed' }, message));
    if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(data);
    else window.parent.postMessage(data, '*');
  }`;

  const body =
    embed.provider === 'youtube'
      ? `<div id="player"></div>
<script>
${send}
function onYouTubeIframeAPIReady() {
  new YT.Player('player', {
    host: 'https://www.youtube-nocookie.com',
    videoId: ${json(embed.videoId)},
    playerVars: ${json({ playsinline: 1, rel: 0, ...(embed.startSeconds ? { start: embed.startSeconds } : {}) })},
    events: {
      onStateChange: function (event) { if (event.data === YT.PlayerState.ENDED) send({ type: 'ended' }); },
      onError: function (event) { send({ type: 'error', code: String(event.data) }); }
    }
  });
}
</script>
<script src="https://www.youtube.com/iframe_api"></script>`
      : `<iframe id="player" src=${json(buildEmbedUrl(embed))} allow="autoplay; fullscreen; picture-in-picture; encrypted-media" allowfullscreen></iframe>
<script src="https://player.vimeo.com/api/player.js"></script>
<script>
${send}
var player = new Vimeo.Player(document.getElementById('player'));
player.on('ended', function () { send({ type: 'ended' }); });
player.on('error', function (error) { send({ type: 'error', code: String(error && error.name) }); });
</script>`;

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
<style>
html, body { margin: 0; height: 100%; background: #000; overflow: hidden; }
#player { position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 0; }
</style>
</head>
<body>
${body}
</body>
</html>`;
}
