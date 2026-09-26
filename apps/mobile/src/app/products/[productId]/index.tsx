import { useQueries, useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { keys } from '@/api/keys';
import { api } from '@/api/v1';
import { useAuth } from '@/auth/auth-context';
import { CourseContentCard, toCourseContent } from '@/components/catalog/course-content-card';
import { Rating } from '@/components/catalog/rating';
import { WishlistButton } from '@/components/catalog/wishlist-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { ErrorState, LoadingState } from '@/components/ui/states';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatPlural, formatPrice } from '@/lib/format';

// The website's product page, word for word where it has words.
const INCLUDED = ['Access for as long as Chiyali operates', 'Certificate of completion', 'Learn at your own pace'];

export default function ProductScreen() {
  const { productId } = useLocalSearchParams<{ productId: string }>();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { status } = useAuth();
  const [expanded, setExpanded] = useState(false);

  const product = useQuery({ queryKey: keys.product(productId), queryFn: () => api.product(productId) });
  const viewer = useQuery({
    queryKey: keys.me.productState(productId),
    queryFn: () => api.productViewerState(productId),
    enabled: status === 'signedIn',
  });
  // Each course's public outline — the product only lists course names.
  const outlines = useQueries({
    queries: (product.data?.courses ?? []).map((course) => ({
      queryKey: keys.course(course.courseId),
      queryFn: () => api.course(course.courseId),
    })),
  });

  if (product.isPending) return <Frame title="Course"><LoadingState /></Frame>;
  if (product.error) {
    return (
      <Frame title="Course">
        <ErrorState message={product.error.message} onRetry={() => void product.refetch()} />
      </Frame>
    );
  }

  const p = product.data;
  const owned = viewer.data?.owned ?? false;
  const lessonCount = outlines.reduce(
    (sum, o) => sum + (o.data?.sections.reduce((n, s) => n + s.lessons.length, 0) ?? 0),
    0,
  );
  const outlinesLoaded = outlines.every((o) => o.data);

  function refresh() {
    void product.refetch();
    void viewer.refetch();
    outlines.forEach((o) => void o.refetch());
  }

  return (
    <ThemedView style={styles.fill}>
      <Stack.Screen options={{ title: '' }} />
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={product.isRefetching} onRefresh={refresh} tintColor={theme.primary} />}>
        <Image source={p.imageUrl} style={[styles.hero, { backgroundColor: theme.backgroundSelected }]} contentFit="cover" />

        <View style={styles.column}>
          <ThemedText type="subtitle" style={styles.title}>
            {p.name}
          </ThemedText>

          <Pressable onPress={() => setExpanded((v) => !v)} accessibilityRole="button" accessibilityHint="Shows the full description">
            <ThemedText themeColor="textSecondary" numberOfLines={expanded ? undefined : 4}>
              {p.description}
            </ThemedText>
            {p.description.length > 180 ? (
              <ThemedText type="smallBold" style={{ color: theme.primary, marginTop: 4 }}>
                {expanded ? 'Show less' : 'Show more'}
              </ThemedText>
            ) : null}
          </Pressable>

          {p.reviewCount > 0 ? (
            <Pressable onPress={() => router.push(`/products/${p.id}/reviews`)} style={styles.inline}>
              <Rating average={p.averageRating} count={p.reviewCount} size={15} />
              <ThemedText type="small" style={{ color: theme.primary }}>
                See reviews
              </ThemedText>
            </Pressable>
          ) : (
            <ThemedText type="small" themeColor="textSecondary">
              No reviews yet
            </ThemedText>
          )}

          <View style={styles.inline}>
            <Stat ios="books.vertical" android="library_books" text={formatPlural(p.courses.length, 'course', 'courses')} />
            {outlinesLoaded ? (
              <Stat ios="play.circle" android="play_circle" text={formatPlural(lessonCount, 'lesson', 'lessons')} />
            ) : null}
          </View>

          <Pressable
            disabled={!p.instructor}
            onPress={() => p.instructor && router.push(`/instructors/${p.instructor.handle}`)}
            style={({ pressed }) => [styles.createdBy, { backgroundColor: theme.backgroundElement, opacity: pressed ? 0.7 : 1 }]}>
            <Avatar name={p.authorName} image={p.instructor?.profileImageUrl} size={44} />
            <View style={styles.flex}>
              <ThemedText type="small" themeColor="textSecondary">
                Created by
              </ThemedText>
              <View style={styles.inline}>
                <ThemedText type="smallBold">{p.authorName}</ThemedText>
                {p.instructor?.isVerified ? (
                  <Icon ios="checkmark.seal.fill" android="verified" size={14} color={theme.primary} />
                ) : null}
              </View>
            </View>
            {p.instructor ? <Icon ios="chevron.right" android="chevron_right" size={16} color={theme.textSecondary} /> : null}
          </Pressable>

          <View style={styles.included}>
            <ThemedText type="smallBold" style={styles.sectionTitle}>
              What&apos;s included
            </ThemedText>
            {INCLUDED.map((item) => (
              <View key={item} style={styles.inline}>
                <Icon ios="checkmark.circle.fill" android="check_circle" size={18} color={theme.primary} />
                <ThemedText type="small">{item}</ThemedText>
              </View>
            ))}
          </View>

          <View style={styles.content}>
            <ThemedText type="smallBold" style={styles.sectionTitle}>
              Course content
            </ThemedText>
            {p.courses.length === 0 ? (
              <ThemedText themeColor="textSecondary">No courses in this product yet.</ThemedText>
            ) : null}
            {outlines.map((outline, index) => {
              const course = p.courses[index]!;
              if (outline.data) {
                return (
                  <CourseContentCard
                    key={course.courseId}
                    course={toCourseContent(outline.data)}
                    canOpenAll={owned}
                    initiallyOpen={index === 0}
                    onPressTitle={() =>
                      router.push(owned ? `/learn/${course.courseId}` : `/courses/${course.courseId}`)
                    }
                  />
                );
              }
              return (
                <ThemedView key={course.courseId} type="backgroundElement" style={styles.coursePending}>
                  <ThemedText type="smallBold">{course.courseName}</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {outline.error ? "Couldn't load this course's lessons." : 'Loading lessons…'}
                  </ThemedText>
                </ThemedView>
              );
            })}
          </View>

          <Pressable
            onPress={() => router.push({ pathname: '/report', params: { targetType: 'product', targetId: p.id } })}
            style={styles.report}>
            <Icon ios="flag" android="flag" size={14} color={theme.textSecondary} />
            <ThemedText type="small" themeColor="textSecondary">
              Report this course
            </ThemedText>
          </Pressable>
        </View>
      </ScrollView>

      <ThemedView style={[styles.bar, { borderTopColor: theme.border, paddingBottom: insets.bottom + Spacing.two }]}>
        {owned ? (
          <>
            <View style={styles.flex}>
              <ThemedText type="smallBold">You own this course</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Find it in My learning.
              </ThemedText>
            </View>
            <Button title="Go to My learning" onPress={() => router.navigate('/learning')} />
          </>
        ) : (
          <>
            <ThemedText type="subtitle" style={styles.price}>
              {formatPrice(p.priceInRupees)}
            </ThemedText>
            <View style={styles.flex} />
            <WishlistButton productId={p.id} variant="outline" size={48} />
          </>
        )}
      </ThemedView>
    </ThemedView>
  );
}

function Stat({ ios, android, text }: { ios: 'books.vertical' | 'play.circle'; android: 'library_books' | 'play_circle'; text: string }) {
  const theme = useTheme();
  return (
    <View style={styles.inline}>
      <Icon ios={ios} android={android} size={16} color={theme.textSecondary} />
      <ThemedText type="small" themeColor="textSecondary">
        {text}
      </ThemedText>
    </View>
  );
}

function Frame({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <ThemedView style={styles.fill}>
      <Stack.Screen options={{ title }} />
      {children}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  flex: { flex: 1 },
  scroll: { paddingBottom: Spacing.six, alignItems: 'center' },
  hero: { width: '100%', maxWidth: MaxContentWidth, aspectRatio: 16 / 9 },
  column: { width: '100%', maxWidth: MaxContentWidth, padding: Spacing.four, gap: Spacing.three },
  title: { fontSize: 26, lineHeight: 32 },
  inline: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, flexWrap: 'wrap' },
  createdBy: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, padding: Spacing.three, borderRadius: 14 },
  included: { gap: Spacing.two, marginTop: Spacing.two },
  content: { gap: Spacing.three, marginTop: Spacing.two },
  sectionTitle: { fontSize: 20, lineHeight: 26 },
  coursePending: { borderRadius: 16, padding: Spacing.three, gap: 2 },
  report: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', paddingVertical: Spacing.two },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  price: { fontSize: 26, lineHeight: 32 },
});
