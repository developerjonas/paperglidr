import type { Embed } from '@repo/video-embeds';
import { createElement, useEffect, useMemo, useRef } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { embedPlayerHtml, parseEmbedPlayerMessage } from '@/components/lesson/embed-html';

/** The web build of VideoEmbed: the same player page, in a srcdoc iframe. */
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
  const frame = useRef<HTMLIFrameElement>(null);
  const finished = useRef(onFinished);
  useEffect(() => {
    finished.current = onFinished;
  }, [onFinished]);

  useEffect(() => {
    let reported = false;
    function onMessage(event: MessageEvent) {
      if (event.source !== frame.current?.contentWindow) return;
      const message = parseEmbedPlayerMessage(event.data);
      if (message?.type === 'ended' && !reported) {
        reported = true;
        finished.current?.();
      }
    }
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [html]);

  return (
    <View style={[styles.media, style]}>
      {createElement('iframe', {
        ref: frame,
        srcDoc: html,
        title: 'Lesson video',
        allow: 'autoplay; fullscreen; picture-in-picture; encrypted-media',
        allowFullScreen: true,
        referrerPolicy: 'strict-origin-when-cross-origin',
        style: { border: 0, width: '100%', height: '100%' },
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  media: { width: '100%', aspectRatio: 16 / 9, backgroundColor: '#000' },
});
