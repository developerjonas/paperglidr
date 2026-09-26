import { useQuery } from '@tanstack/react-query';
import { useEventListener } from 'expo';
import { useVideoPlayer, VideoView } from 'expo-video';
import * as WebBrowser from 'expo-web-browser';
import { useRef } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import type { LessonAsset } from '@/api/types';
import { api } from '@/api/v1';
import { Embed } from '@/components/lesson/embed';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/**
 * The lesson's main content, like the website's LessonContentViewer: an
 * uploaded video plays here (and reports when it ends), a Bunny video or a
 * YouTube preview plays in an embed, a PDF opens in the in-app browser.
 * The signed URL is fetched fresh each time (they expire).
 */
export function LessonPlayer({ asset, onFinished }: { asset: LessonAsset | undefined; onFinished?: () => void }) {
  const theme = useTheme();
  const delivery = useQuery({
    queryKey: ['asset', asset?.url],
    queryFn: () => api.lessonAsset(asset!.url),
    enabled: asset != null,
    staleTime: 0,
    gcTime: 0,
  });

  if (asset == null) {
    return (
      <Frame>
        <ThemedText type="small" themeColor="textSecondary" style={styles.center}>
          No content has been uploaded for this lesson yet.
        </ThemedText>
      </Frame>
    );
  }
  if (delivery.isPending) {
    return (
      <Frame>
        <ActivityIndicator color={theme.primary} />
      </Frame>
    );
  }
  if (delivery.error) {
    return (
      <Frame>
        <ThemedText type="small" themeColor="textSecondary" style={styles.center}>
          {delivery.error.message}
        </ThemedText>
        <Button title="Try again" variant="outline" onPress={() => void delivery.refetch()} />
      </Frame>
    );
  }

  const d = delivery.data;
  if (d.type === 'youtube') {
    return <Embed uri={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(d.externalId)}?playsinline=1`} />;
  }
  if (d.type === 'bunny_embed') return <Embed uri={d.url} />;
  if (asset.type === 'video_file' && d.type === 'inline') return <Video url={d.url} onFinished={onFinished} />;
  if (asset.type === 'pdf') {
    return (
      <Frame>
        <Icon ios="doc.richtext" android="picture_as_pdf" size={40} color={theme.primary} />
        <Button
          title={asset.fileName ? `Open ${asset.fileName}` : 'Open PDF'}
          onPress={() => void WebBrowser.openBrowserAsync(d.url)}
        />
      </Frame>
    );
  }
  return (
    <Frame>
      <ThemedText type="small" themeColor="textSecondary" style={styles.center}>
        Unsupported lesson content type.
      </ThemedText>
    </Frame>
  );
}

function Video({ url, onFinished }: { url: string; onFinished?: () => void }) {
  const player = useVideoPlayer(url, (p) => {
    p.play();
  });
  // Report the end once per mount (the website marks the lesson complete).
  const reported = useRef(false);
  useEventListener(player, 'playToEnd', () => {
    if (reported.current) return;
    reported.current = true;
    onFinished?.();
  });
  return <VideoView player={player} style={styles.media} nativeControls allowsPictureInPicture contentFit="contain" />;
}

function Frame({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  return <View style={[styles.media, styles.frame, { backgroundColor: theme.backgroundElement }]}>{children}</View>;
}

const styles = StyleSheet.create({
  media: { width: '100%', aspectRatio: 16 / 9, backgroundColor: '#000' },
  frame: { alignItems: 'center', justifyContent: 'center', gap: Spacing.three, padding: Spacing.four },
  center: { textAlign: 'center' },
});
