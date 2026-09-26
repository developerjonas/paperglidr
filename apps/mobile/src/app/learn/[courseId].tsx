import { useQuery } from '@tanstack/react-query';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { keys } from '@/api/keys';
import { api } from '@/api/v1';
import { CourseContentCard } from '@/components/catalog/course-content-card';
import { CourseReviewsSection } from '@/components/catalog/course-reviews-section';
import { RequireAuth } from '@/components/require-auth';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { ErrorState, LoadingState } from '@/components/ui/states';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { nextLessonId } from '@/lib/course';

export default function LearnCourseScreen() {
  return (
    <RequireAuth reason="open your course" title="Course">
      <LearnCourse />
    </RequireAuth>
  );
}

/** The course player: progress, continue, the outline with ticks, reviews. */
function LearnCourse() {
  const { courseId } = useLocalSearchParams<{ courseId: string }>();
  const theme = useTheme();
  const course = useQuery({ queryKey: keys.me.course(courseId), queryFn: () => api.myCourse(courseId) });

  if (course.isPending) return <><Stack.Screen options={{ title: 'Course' }} /><LoadingState /></>;
  if (course.error) {
    return (
      <>
        <Stack.Screen options={{ title: 'Course' }} />
        <ErrorState message={course.error.message} onRetry={() => void course.refetch()} />
      </>
    );
  }

  const c = course.data;
  const percent = c.totalLessons === 0 ? 0 : Math.round((c.completedLessons / c.totalLessons) * 100);
  const next = nextLessonId(c);

  return (
    <>
      <Stack.Screen options={{ title: '' }} />
      <Screen refreshing={course.isRefetching} onRefresh={() => void course.refetch()}>
        <View style={styles.header}>
          <ThemedText type="subtitle" style={styles.title}>
            {c.name}
          </ThemedText>
          <ThemedText themeColor="textSecondary">{c.description}</ThemedText>
        </View>

        <ThemedView type="backgroundElement" style={styles.progressCard}>
          <View style={styles.progressRow}>
            <ThemedText type="smallBold">{percent}% complete</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {c.completedLessons} of {c.totalLessons} lessons
            </ThemedText>
          </View>
          <View style={[styles.track, { backgroundColor: theme.backgroundSelected }]}>
            <View style={[styles.fill, { width: `${percent}%`, backgroundColor: theme.primary }]} />
          </View>
          {next ? (
            <Button
              title={percent === 0 ? 'Start course' : percent === 100 ? 'Watch again' : 'Continue where you left off'}
              onPress={() => router.push(`/lessons/${next}`)}
            />
          ) : null}
        </ThemedView>

        <CourseContentCard course={c} canOpenAll initiallyOpen />

        <CourseReviewsSection courseId={c.id} learner={c} />
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  header: { gap: Spacing.two },
  title: { fontSize: 26, lineHeight: 32 },
  progressCard: { borderRadius: 16, padding: Spacing.three, gap: Spacing.three },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  track: { height: 8, borderRadius: 4, overflow: 'hidden' },
  fill: { height: 8 },
});
