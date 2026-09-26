import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { keys } from '@/api/keys';
import { api } from '@/api/v1';
import { MyCourseCard } from '@/components/catalog/my-course-card';
import { RequireAuth } from '@/components/require-auth';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { ErrorState, LoadingState } from '@/components/ui/states';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function LearningScreen() {
  return (
    <RequireAuth reason="see your courses">
      <MyLearning />
    </RequireAuth>
  );
}

/** The website's "My courses": courses you have access to, A–Z, with progress. */
function MyLearning() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const courses = useQuery({ queryKey: keys.me.courses, queryFn: api.myCourses });

  return (
    <ThemedView style={styles.fill}>
      <FlatList
        data={courses.data ?? []}
        keyExtractor={(course) => course.id}
        renderItem={({ item }) => <MyCourseCard course={item} />}
        ItemSeparatorComponent={() => <View style={{ height: Spacing.three }} />}
        contentContainerStyle={[styles.list, { paddingTop: insets.top + Spacing.three }]}
        refreshControl={
          <RefreshControl refreshing={courses.isRefetching} onRefresh={() => void courses.refetch()} tintColor={theme.primary} />
        }
        ListHeaderComponent={
          <ThemedText type="subtitle" style={styles.title}>
            My learning
          </ThemedText>
        }
        ListEmptyComponent={
          courses.isPending ? (
            <LoadingState />
          ) : courses.error ? (
            <ErrorState message={courses.error.message} onRetry={() => void courses.refetch()} />
          ) : (
            <View style={[styles.empty, { borderColor: theme.border }]}>
              <ThemedText themeColor="textSecondary">You have no courses yet.</ThemedText>
              <Button title="Browse Courses" onPress={() => router.navigate('/browse')} />
            </View>
          )
        }
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  list: { paddingHorizontal: Spacing.four, paddingBottom: Spacing.six, width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center' },
  title: { marginBottom: Spacing.three },
  empty: { borderWidth: 1, borderStyle: 'dashed', borderRadius: 16, padding: Spacing.five, gap: Spacing.three, alignItems: 'center' },
});
