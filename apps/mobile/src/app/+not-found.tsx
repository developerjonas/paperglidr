import { router, Stack } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { Spacing } from '@/constants/theme';

/** A link to a screen that doesn't exist (e.g. an old or mistyped deep link). */
export default function NotFoundScreen() {
  return (
    <ThemedView style={styles.fill}>
      <Stack.Screen options={{ title: 'Not found' }} />
      <View style={styles.column}>
        <ThemedText type="subtitle" style={styles.center}>
          This page doesn&apos;t exist
        </ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.center}>
          The link may be old or mistyped.
        </ThemedText>
        <Button title="Go home" onPress={() => router.replace('/')} />
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.four },
  column: { width: '100%', maxWidth: 420, gap: Spacing.three },
  center: { textAlign: 'center' },
});
