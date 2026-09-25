import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** A form-level error or success message. */
export function FormMessage({ message, tone = 'error' }: { message: string | null; tone?: 'error' | 'success' }) {
  const theme = useTheme();
  if (!message) return null;
  const color = tone === 'error' ? theme.danger : theme.success;
  return (
    <View
      accessibilityRole="alert"
      style={[styles.box, { backgroundColor: theme.backgroundElement, borderColor: color }]}>
      <ThemedText type="small" style={{ color }}>
        {message}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { borderWidth: 1, borderRadius: 12, padding: Spacing.three },
});
