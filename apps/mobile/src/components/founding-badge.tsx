import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';

/** "Founding creator": one of the first creators on Chiyali (same as the website's badge). */
export function FoundingBadge({ compact = false }: { compact?: boolean }) {
  return (
    <View style={styles.badge} accessibilityLabel="Founding creator">
      <ThemedText style={[styles.text, compact && styles.compact]}>{compact ? '✦ Founding' : '✦ Founding creator'}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { alignSelf: 'center', borderRadius: 999, backgroundColor: 'rgba(245, 158, 11, 0.16)', paddingHorizontal: 8, paddingVertical: 2 },
  text: { color: '#b45309', fontSize: 12, lineHeight: 16, fontWeight: '600' },
  compact: { fontSize: 11, lineHeight: 14 },
});
