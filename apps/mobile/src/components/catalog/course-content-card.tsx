import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import type { PublicCourse } from '@/api/types';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Icon } from '@/components/ui/icon';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatPlural } from '@/lib/format';

export type CourseContent = {
  id: string;
  name: string;
  sections: {
    id: string;
    name: string;
    lessons: { id: string; name: string; isPreview: boolean; isComplete?: boolean }[];
  }[];
};

/** The public outline (GET /api/v1/courses/:id) in the card's shape. */
export function toCourseContent(course: PublicCourse): CourseContent {
  return {
    id: course.id,
    name: course.name,
    sections: course.sections.map((section) => ({
      id: section.id,
      name: section.name,
      lessons: section.lessons.map((lesson) => ({
        id: lesson.id,
        name: lesson.name,
        isPreview: lesson.status === 'preview',
      })),
    })),
  };
}

/**
 * One course of a product, as the website's "Course content" card: name,
 * "N sections • N lessons", and sections that expand to their lessons.
 * Free preview lessons open (and so does every lesson when `canOpenAll`,
 * i.e. the viewer has the course). `isComplete` ticks show when present.
 */
export function CourseContentCard({
  course,
  canOpenAll = false,
  initiallyOpen = false,
  onPressTitle,
}: {
  course: CourseContent;
  canOpenAll?: boolean;
  initiallyOpen?: boolean;
  onPressTitle?: () => void;
}) {
  const theme = useTheme();
  const lessonCount = course.sections.reduce((sum, s) => sum + s.lessons.length, 0);
  const completed = course.sections.reduce((sum, s) => sum + s.lessons.filter((l) => l.isComplete).length, 0);
  const tracksProgress = course.sections.some((s) => s.lessons.some((l) => l.isComplete !== undefined));

  return (
    <ThemedView style={[styles.card, { borderColor: theme.border }]}>
      <Pressable disabled={!onPressTitle} onPress={onPressTitle} style={styles.header}>
        <View style={styles.headerText}>
          <ThemedText type="smallBold" style={styles.courseName}>
            {course.name}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {formatPlural(course.sections.length, 'section', 'sections')} •{' '}
            {formatPlural(lessonCount, 'lesson', 'lessons')}
            {tracksProgress ? ` • ${completed} done` : ''}
          </ThemedText>
        </View>
        {onPressTitle ? (
          <Icon ios="chevron.right" android="chevron_right" size={16} color={theme.textSecondary} />
        ) : null}
      </Pressable>

      {tracksProgress && lessonCount > 0 ? (
        <View style={[styles.progressTrack, { backgroundColor: theme.backgroundSelected }]}>
          <View
            style={[styles.progressFill, { backgroundColor: theme.success, width: `${(completed / lessonCount) * 100}%` }]}
          />
        </View>
      ) : null}

      {course.sections.length === 0 ? (
        <ThemedText type="small" themeColor="textSecondary" style={styles.noContent}>
          No lessons published yet.
        </ThemedText>
      ) : (
        course.sections.map((section, index) => (
          <Section
            key={section.id}
            section={section}
            canOpenAll={canOpenAll}
            initiallyOpen={initiallyOpen && index === 0}
          />
        ))
      )}
    </ThemedView>
  );
}

function Section({
  section,
  canOpenAll,
  initiallyOpen,
}: {
  section: CourseContent['sections'][number];
  canOpenAll: boolean;
  initiallyOpen: boolean;
}) {
  const theme = useTheme();
  const [open, setOpen] = useState(initiallyOpen);

  return (
    <View style={[styles.section, { borderTopColor: theme.border }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen((v) => !v)}
        style={styles.sectionHeader}>
        <View style={styles.headerText}>
          <ThemedText style={styles.sectionName}>{section.name}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {formatPlural(section.lessons.length, 'lesson', 'lessons')}
          </ThemedText>
        </View>
        <Icon
          ios={open ? 'chevron.up' : 'chevron.down'}
          android={open ? 'expand_less' : 'expand_more'}
          size={16}
          color={theme.textSecondary}
        />
      </Pressable>

      {open
        ? section.lessons.map((lesson) => {
            const openable = canOpenAll || lesson.isPreview;
            return (
              <Pressable
                key={lesson.id}
                disabled={!openable}
                accessibilityRole={openable ? 'button' : undefined}
                accessibilityLabel={`${lesson.name}${lesson.isPreview ? ', free preview' : ''}${lesson.isComplete ? ', completed' : ''}`}
                onPress={() => router.push(`/lessons/${lesson.id}`)}
                style={({ pressed }) => [styles.lesson, { opacity: pressed ? 0.6 : 1 }]}>
                {lesson.isComplete ? (
                  <Icon ios="checkmark.circle.fill" android="check_circle" size={18} color={theme.success} />
                ) : openable ? (
                  <Icon ios="play.circle" android="play_circle" size={18} color={theme.primary} />
                ) : (
                  <Icon ios="lock" android="lock" size={16} color={theme.textSecondary} />
                )}
                <ThemedText
                  type="small"
                  style={[styles.lessonName, { color: openable ? theme.text : theme.textSecondary }]}
                  numberOfLines={2}>
                  {lesson.name}
                </ThemedText>
                {lesson.isPreview && !canOpenAll ? (
                  <View style={[styles.previewBadge, { borderColor: theme.primary }]}>
                    <ThemedText type="small" style={{ color: theme.primary, fontSize: 11 }}>
                      Preview
                    </ThemedText>
                  </View>
                ) : null}
              </Pressable>
            );
          })
        : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 16, overflow: 'hidden' },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, padding: Spacing.three },
  headerText: { flex: 1, gap: 2 },
  courseName: { fontSize: 16, lineHeight: 22 },
  progressTrack: { height: 4, marginHorizontal: Spacing.three, marginBottom: Spacing.three, borderRadius: 2 },
  progressFill: { height: 4, borderRadius: 2 },
  noContent: { paddingHorizontal: Spacing.three, paddingBottom: Spacing.three },
  section: { borderTopWidth: StyleSheet.hairlineWidth },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, padding: Spacing.three },
  sectionName: { fontSize: 15, fontWeight: '600' },
  lesson: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  lessonName: { flex: 1 },
  previewBadge: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 1 },
});
