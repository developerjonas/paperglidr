import { createElement, useEffect, useRef } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { bunnyPlayerHtml, parseEmbedPlayerMessage } from '@/components/lesson/embed-html';
import { Watermark } from '@/components/lesson/watermark';

/** A paid lesson's Bunny video on web: react-native-webview is native-only, so a srcdoc iframe. */
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
  const reported = useRef(false);
  useEffect(() => {
    function onMessage(event: MessageEvent) {
      const message = parseEmbedPlayerMessage(event.data);
      if (message?.type === 'ended' && !reported.current) {
        reported.current = true;
        onFinished?.();
      }
    }
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [onFinished]);

  return (
    <View style={[styles.media, style]}>
      {createElement('iframe', {
        srcDoc: bunnyPlayerHtml(uri),
        title: 'Lesson video',
        allow: 'autoplay; encrypted-media',
        style: { border: 0, width: '100%', height: '100%' },
      })}
      {watermark ? <Watermark text={watermark} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  media: { width: '100%', aspectRatio: 16 / 9, backgroundColor: '#000', overflow: 'hidden' },
});
