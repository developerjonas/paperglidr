import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

import { API_URL } from '@/api/config';

/** A video embed (Bunny Stream, YouTube preview) — native WebView. */
export function Embed({ uri }: { uri: string }) {
  return (
    <View style={styles.media}>
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
