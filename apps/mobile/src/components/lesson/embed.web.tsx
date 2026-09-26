import { createElement } from 'react';
import { StyleSheet, View } from 'react-native';

/** A video embed on web: react-native-webview is native-only, so a plain iframe. */
export function Embed({ uri }: { uri: string }) {
  return (
    <View style={styles.media}>
      {createElement('iframe', {
        src: uri,
        title: 'Lesson video',
        allow: 'autoplay; fullscreen; picture-in-picture; encrypted-media',
        allowFullScreen: true,
        style: { border: 0, width: '100%', height: '100%' },
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  media: { width: '100%', aspectRatio: 16 / 9, backgroundColor: '#000' },
});
