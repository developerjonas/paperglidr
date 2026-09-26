import { EMBED_PROVIDERS, type Embed } from '@repo/video-embeds';
import { useMemo, useRef } from 'react';
import { Linking, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';

import { API_URL } from '@/api/config';
import { embedPlayerHtml, parseEmbedPlayerMessage } from '@/components/lesson/embed-html';

const ALLOWED_HOSTS = new Set<string>(Object.values(EMBED_PROVIDERS).flatMap((p) => p.hosts));

/**
 * A free-tier lesson's YouTube or Vimeo video in a WebView, via the
 * provider's player API. onFinished fires once when the video ends. The
 * page's base URL is the Chiyali site, so YouTube sees a real referrer.
 * Links out of the player (e.g. "Watch on YouTube") open in the browser.
 */
export function VideoEmbed({
  embed,
  onFinished,
  style,
}: {
  embed: Embed;
  onFinished?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  const html = useMemo(() => embedPlayerHtml(embed), [embed]);
  const reported = useRef(false);

  function onMessage(event: WebViewMessageEvent) {
    const message = parseEmbedPlayerMessage(event.nativeEvent.data);
    if (message?.type === 'ended' && !reported.current) {
      reported.current = true;
      onFinished?.();
    }
  }

  return (
    <View style={[styles.media, style]}>
      <WebView
        source={{ html, baseUrl: API_URL }}
        onMessage={onMessage}
        allowsFullscreenVideo
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        onShouldStartLoadWithRequest={(request) => {
          // The player's own frames load freely; the page itself stays put.
          if (request.isTopFrame === false) return true;
          if (request.url.startsWith('about:') || request.url.startsWith(API_URL)) return true;
          try {
            if (ALLOWED_HOSTS.has(new URL(request.url).hostname)) void Linking.openURL(request.url);
          } catch {}
          return false;
        }}
        style={styles.web}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  media: { width: '100%', aspectRatio: 16 / 9, backgroundColor: '#000' },
  web: { flex: 1, backgroundColor: '#000' },
});
