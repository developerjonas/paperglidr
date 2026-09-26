import { useQuery } from '@tanstack/react-query';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { keys } from '@/api/keys';
import { api } from '@/api/v1';
import { useAuth } from '@/auth/auth-context';
import { CourseContentCard, toCourseContent } from '@/components/catalog/course-content-card';
import { CourseReviewsSection } from '@/components/catalog/course-reviews-section';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { ErrorState, LoadingState } from '@/components/ui/states';
import { Spacing } from '@/constants/theme';

/**
 * A course's public page: name, description, its outline (free previews
 * play) and reviews. If you have the course, it points you to the player.
 */
export default function CourseScreen() {
  const { courseId } = useLocalSearchParams<{ courseId: string }>();
  const { status } = useAuth();
  const course = useQuery({ queryKey: keys.course(courseId), queryFn: () => api.course(courseId) });
  const myCourses = useQuery({ queryKey: keys.me.courses, queryFn: api.myCourses, enabled: status === 'signedIn' });
  const owned = myCourses.data?.some((c) => c.id === courseId) ?? false;

  if (course.isPending) return <><Stack.Screen options={{ title: 'Course' }} /><LoadingState /></>;
  if (course.error) {
    return (
      <>
        <Stack.Screen options={{ title: 'Course' }} />
        <ErrorState message={course.error.message} onRetry={() => void course.refetch()} />
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: '' }} />
      <Screen refreshing={course.isRefetching} onRefresh={() => void course.refetch()}>
        <View style={styles.header}>
          <ThemedText type="subtitle" style={styles.title}>
            {course.data.name}
          </ThemedText>
          <ThemedText themeColor="textSecondary">{course.data.description}</ThemedText>
        </View>
        {owned ? (
          <ThemedView type="backgroundElement" style={styles.owned}>
            <ThemedText type="smallBold">You have this course</ThemedText>
            <Button title="Go to course" onPress={() => router.replace(`/learn/${courseId}`)} />
          </ThemedView>
        ) : null}
        <CourseContentCard course={toCourseContent(course.data)} canOpenAll={owned} initiallyOpen />
        <CourseReviewsSection courseId={courseId} />
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  header: { gap: Spacing.two },
  title: { fontSize: 26, lineHeight: 32 },
  owned: { borderRadius: 16, padding: Spacing.three, gap: Spacing.three },
});
