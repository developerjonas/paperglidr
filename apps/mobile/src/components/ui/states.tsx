import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function LoadingState() {
  const theme = useTheme();
  return (
    <View style={styles.center}>
      <ActivityIndicator color={theme.primary} />
    </View>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <View style={styles.center}>
      <ThemedText themeColor="textSecondary" style={styles.text}>
        {message}
      </ThemedText>
      {onRetry ? <Button title="Try again" variant="outline" onPress={onRetry} /> : null}
    </View>
  );
}

export function EmptyState({ title, message }: { title: string; message: string }) {
  const theme = useTheme();
  return (
    <View style={[styles.empty, { borderColor: theme.border }]}>
      <ThemedText type="smallBold" style={styles.text}>
        {title}
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary" style={styles.text}>
        {message}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { paddingVertical: Spacing.six, alignItems: 'center', gap: Spacing.three },
  text: { textAlign: 'center' },
  empty: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 16,
    padding: Spacing.five,
    gap: Spacing.two,
    alignItems: 'center',
  },
});
