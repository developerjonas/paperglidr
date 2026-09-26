import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { WebView } from 'react-native-webview';

import { API_URL } from '@/api/config';

/** A Bunny Stream embed — native WebView. (YouTube/Vimeo: VideoEmbed.) */
export function Embed({ uri, style }: { uri: string; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.media, style]}>
      <WebView
        source={{ uri, headers: { Referer: API_URL } }}
        allowsFullscreenVideo
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        style={styles.web}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  media: { width: '100%', aspectRatio: 16 / 9, backgroundColor: '#000' },
  web: { flex: 1, backgroundColor: '#000' },
});
