import { parseEmbedUrl } from '@repo/video-embeds';
import { useQuery } from '@tanstack/react-query';
import { useEventListener } from 'expo';
import { useVideoPlayer, VideoView } from 'expo-video';
import * as WebBrowser from 'expo-web-browser';
import { useRef } from 'react';
import { ActivityIndicator, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import type { LessonAsset } from '@/api/types';
import { api } from '@/api/v1';
import { Embed } from '@/components/lesson/embed';
import { VideoEmbed } from '@/components/lesson/video-embed';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/**
 * The lesson's main content, like the website's LessonContentViewer: an
 * uploaded video plays here, a free lesson's YouTube/Vimeo video plays
 * through the provider's player (both report when they end), a Bunny video
 * plays in an embed, a PDF opens in the in-app browser. The signed URL is
 * fetched fresh each time (they expire). `fullscreen` fills the parent
 * instead of a 16:9 box (the lesson screen in landscape).
 */
export function LessonPlayer({
  asset,
  onFinished,
  fullscreen = false,
}: {
  asset: LessonAsset | undefined;
  onFinished?: () => void;
  fullscreen?: boolean;
}) {
  const theme = useTheme();
  const box: StyleProp<ViewStyle> = fullscreen ? styles.fill : undefined;
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
  if (d.type === 'youtube' || d.type === 'vimeo') {
    // Checked against the shared allowlist again before it's loaded.
    const embed = parseEmbedUrl(d.embedUrl);
    if (embed != null) return <VideoEmbed key={d.embedUrl} embed={embed} onFinished={onFinished} style={box} />;
  }
  if (d.type === 'bunny_embed') return <Embed uri={d.url} style={box} />;
  if (asset.type === 'video_file' && d.type === 'inline') return <Video url={d.url} onFinished={onFinished} style={box} />;
  if (asset.type === 'pdf' && 'url' in d) {
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

function Video({ url, onFinished, style }: { url: string; onFinished?: () => void; style?: StyleProp<ViewStyle> }) {
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
  return <VideoView player={player} style={[styles.media, style]} nativeControls allowsPictureInPicture contentFit="contain" />;
}

function Frame({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  return <View style={[styles.media, styles.frame, { backgroundColor: theme.backgroundElement }]}>{children}</View>;
}

const styles = StyleSheet.create({
  media: { width: '100%', aspectRatio: 16 / 9, backgroundColor: '#000' },
  fill: { flex: 1, aspectRatio: undefined },
  frame: { alignItems: 'center', justifyContent: 'center', gap: Spacing.three, padding: Spacing.four },
  center: { textAlign: 'center' },
});
