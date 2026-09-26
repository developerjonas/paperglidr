import { useQuery } from '@tanstack/react-query';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { keys } from '@/api/keys';
import { api } from '@/api/v1';
import { ProductCarousel } from '@/components/catalog/product-carousel';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Avatar } from '@/components/ui/avatar';
import { Icon } from '@/components/ui/icon';
import { Screen } from '@/components/ui/screen';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/states';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatPlural } from '@/lib/format';

/**
 * An instructor's public profile, as the website's /instructors/[handle]:
 * photo, name, @handle, bio and their published courses — plus their
 * products to browse, Udemy-style.
 */
export default function InstructorScreen() {
  const { handle } = useLocalSearchParams<{ handle: string }>();
  const theme = useTheme();
  const [bioOpen, setBioOpen] = useState(false);
  const instructor = useQuery({ queryKey: keys.instructor(handle), queryFn: () => api.instructor(handle) });

  if (instructor.isPending) return <><Stack.Screen options={{ title: 'Instructor' }} /><LoadingState /></>;
  if (instructor.error) {
    return (
      <>
        <Stack.Screen options={{ title: 'Instructor' }} />
        <ErrorState message={instructor.error.message} onRetry={() => void instructor.refetch()} />
      </>
    );
  }
  const i = instructor.data;

  return (
    <>
      <Stack.Screen options={{ title: '' }} />
      <Screen refreshing={instructor.isRefetching} onRefresh={() => void instructor.refetch()}>
        <View style={styles.header}>
          <Avatar name={i.name} image={i.profileImageUrl} size={96} />
          <View style={styles.nameRow}>
            <ThemedText type="subtitle" style={styles.name}>
              {i.name}
            </ThemedText>
            {i.isVerified ? <Icon ios="checkmark.seal.fill" android="verified" size={20} color={theme.primary} /> : null}
          </View>
          <ThemedText themeColor="textSecondary">@{i.handle}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {formatPlural(i.courses.length, 'course', 'courses')} · {formatPlural(i.products.length, 'product', 'products')}
          </ThemedText>
        </View>

        {i.bio ? (
          <Pressable onPress={() => setBioOpen((v) => !v)} accessibilityRole="button" accessibilityHint="Shows the full bio">
            <ThemedText numberOfLines={bioOpen ? undefined : 5}>{i.bio}</ThemedText>
            {i.bio.length > 240 ? (
              <ThemedText type="smallBold" style={{ color: theme.primary, marginTop: 4 }}>
                {bioOpen ? 'Show less' : 'Show more'}
              </ThemedText>
            ) : null}
          </Pressable>
        ) : null}

        <ProductCarousel title={`Products by ${i.name.split(/\s+/)[0]}`} products={i.products} />

        <View style={styles.courses}>
          <ThemedText type="smallBold" style={styles.sectionTitle}>
            Courses
          </ThemedText>
          {i.courses.length === 0 ? (
            <EmptyState title="No courses yet" message="This instructor hasn't published any courses yet." />
          ) : (
            i.courses.map((course) => (
              <Pressable
                key={course.id}
                accessibilityRole="button"
                onPress={() => router.push(`/courses/${course.id}`)}
                style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
                <ThemedView style={[styles.course, { borderColor: theme.border }]}>
                  <View style={styles.flex}>
                    <ThemedText type="smallBold" style={styles.courseName}>
                      {course.name}
                    </ThemedText>
                    <ThemedText type="small" themeColor="textSecondary" numberOfLines={2}>
                      {course.description}
                    </ThemedText>
                  </View>
                  <Icon ios="chevron.right" android="chevron_right" size={16} color={theme.textSecondary} />
                </ThemedView>
              </Pressable>
            ))
          )}
        </View>
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: 'center', gap: Spacing.one, marginTop: Spacing.two },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, marginTop: Spacing.two },
  name: { fontSize: 26, lineHeight: 32, textAlign: 'center' },
  courses: { gap: Spacing.three },
  sectionTitle: { fontSize: 20, lineHeight: 26 },
  course: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 14,
    padding: Spacing.three,
  },
  courseName: { fontSize: 16 },
  flex: { flex: 1 },
});
