import { useMemo, useRef } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';

import { API_URL } from '@/api/config';
import { bunnyPlayerHtml, parseEmbedPlayerMessage } from '@/components/lesson/embed-html';
import { Watermark } from '@/components/lesson/watermark';

/**
 * A paid lesson's Bunny Stream video in a WebView (YouTube/Vimeo: VideoEmbed).
 * The page's base URL is the Chiyali site, so Bunny's allowed-domains check
 * passes. No WebView fullscreen: the lesson screen fills the screen in
 * landscape itself, so the watermark stays on top. onFinished fires once.
 */
export function Embed({
  uri,
  watermark,
  onFinished,
  style,
}: {
  uri: string;
  watermark?: string;
  onFinished?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  const html = useMemo(() => bunnyPlayerHtml(uri), [uri]);
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
        allowsFullscreenVideo={false}
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        // The player's own frames load; the page itself never navigates away.
        onShouldStartLoadWithRequest={(request) =>
          request.isTopFrame === false || request.url.startsWith('about:') || request.url.startsWith(API_URL)
        }
        style={styles.web}
      />
      {watermark ? <Watermark text={watermark} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  media: { width: '100%', aspectRatio: 16 / 9, backgroundColor: '#000', overflow: 'hidden' },
  web: { flex: 1, backgroundColor: '#000' },
});
