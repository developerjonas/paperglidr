import { Pressable, ScrollView, StyleSheet } from 'react-native';

import type { Category } from '@/api/types';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** "All Courses" plus every category, as the website's browse bar. `selected` null = all. */
export function CategoryChips({
  categories,
  selected,
  onSelect,
  includeAll = true,
}: {
  categories: Category[];
  selected: string | null;
  onSelect: (categoryId: string | null) => void;
  includeAll?: boolean;
}) {
  const items = [...(includeAll ? [{ id: null, name: 'All Courses' }] : []), ...categories];
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {items.map((item) => (
        <Chip key={item.id ?? 'all'} label={item.name} active={item.id === selected} onPress={() => onSelect(item.id)} />
      ))}
    </ScrollView>
  );
}

export function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        active
          ? { backgroundColor: theme.primary, borderColor: theme.primary }
          : { backgroundColor: theme.background, borderColor: theme.border },
        { opacity: pressed ? 0.7 : 1 },
      ]}>
      <ThemedText type="small" style={{ color: active ? theme.onPrimary : theme.text, fontWeight: '600' }}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { gap: Spacing.two, paddingVertical: Spacing.one },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 7 },
});
