import { StyleSheet, View } from 'react-native';

import type { TicketStatus } from '@/api/types';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { STATUS_LABELS } from '@/lib/support';

export function StatusBadge({ status }: { status: TicketStatus }) {
  const theme = useTheme();
  const open = status === 'open';
  return (
    <View style={[styles.badge, { backgroundColor: open ? theme.primary : theme.backgroundSelected }]}>
      <ThemedText type="small" style={[styles.text, { color: open ? theme.onPrimary : theme.text }]}>
        {STATUS_LABELS[status]}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 2, alignSelf: 'flex-start' },
  text: { fontSize: 12, fontWeight: '600' },
});
