import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** A titled group of rows, like an iOS settings section. */
export function ListSection({ title, children }: { title?: string; children: ReactNode }) {
  const theme = useTheme();
  return (
    <View style={styles.section}>
      {title ? (
        <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionTitle}>
          {title.toUpperCase()}
        </ThemedText>
      ) : null}
      <ThemedView type="backgroundElement" style={[styles.group, { borderColor: theme.border }]}>
        {children}
      </ThemedView>
    </View>
  );
}

/** One row: label, optional value on the right, chevron when tappable. */
export function ListRow({
  label,
  value,
  onPress,
  tone = 'default',
  last = false,
}: {
  label: string;
  value?: string;
  onPress?: () => void;
  tone?: 'default' | 'danger' | 'primary';
  last?: boolean;
}) {
  const theme = useTheme();
  const color = tone === 'danger' ? theme.danger : tone === 'primary' ? theme.primary : theme.text;
  const content = (
    <View style={[styles.row, !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderColor: theme.border }]}>
      <ThemedText style={{ color, flexShrink: 1 }}>{label}</ThemedText>
      <View style={styles.right}>
        {value ? (
          <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
            {value}
          </ThemedText>
        ) : null}
        {onPress ? (
          <ThemedText themeColor="textSecondary" style={styles.chevron}>
            ›
          </ThemedText>
        ) : null}
      </View>
    </View>
  );
  if (!onPress) return content;
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  section: { gap: Spacing.two },
  sectionTitle: { letterSpacing: 0.6, fontSize: 12, marginLeft: Spacing.three },
  group: { borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  row: {
    minHeight: 50,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  right: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, flexShrink: 1 },
  chevron: { fontSize: 22, lineHeight: 24 },
});
