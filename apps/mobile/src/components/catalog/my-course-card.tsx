import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import type { MyCourse } from '@/api/types';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatPlural } from '@/lib/format';

/**
 * A course you have, as the website's "My courses" card — name, "N sections
 * • N lessons", description, progress — with Udemy's percent and Continue.
 */
export function MyCourseCard({ course }: { course: MyCourse }) {
  const theme = useTheme();
  const percent = course.totalLessons === 0 ? 0 : Math.round((course.completedLessons / course.totalLessons) * 100);
  const label = percent === 0 ? 'Start course' : percent === 100 ? 'Review course' : 'Continue';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${course.name}, ${percent}% complete`}
      onPress={() => router.push(`/learn/${course.id}`)}
      style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}>
      <ThemedView style={[styles.card, { borderColor: theme.border }]}>
        <View style={styles.body}>
          <ThemedText type="smallBold" style={styles.name} numberOfLines={2}>
            {course.name}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {formatPlural(course.totalSections, 'section', 'sections')} •{' '}
            {formatPlural(course.totalLessons, 'lesson', 'lessons')}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary" numberOfLines={2}>
            {course.description}
          </ThemedText>
          <View style={styles.footer}>
            <ThemedText type="small" themeColor="textSecondary">
              {percent}% complete
            </ThemedText>
            <ThemedText type="smallBold" style={{ color: theme.primary }}>
              {label} →
            </ThemedText>
          </View>
        </View>
        <View style={[styles.track, { backgroundColor: theme.backgroundSelected }]}>
          <View style={[styles.fill, { width: `${percent}%`, backgroundColor: theme.primary }]} />
        </View>
      </ThemedView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 16, overflow: 'hidden' },
  body: { padding: Spacing.three, gap: Spacing.one },
  name: { fontSize: 17, lineHeight: 23 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Spacing.two },
  track: { height: 6 },
  fill: { height: 6 },
});
