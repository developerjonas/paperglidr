import { useInfiniteQuery } from '@tanstack/react-query';
import { Stack, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';

import type { ProductReview } from '@/api/types';
import { api } from '@/api/v1';
import { Stars } from '@/components/catalog/rating';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Avatar } from '@/components/ui/avatar';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/states';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatDate, formatPlural, formatRating } from '@/lib/format';

/** Every visible review of the product's courses, newest first (20 per page). */
export default function ProductReviewsScreen() {
  const { productId } = useLocalSearchParams<{ productId: string }>();
  const theme = useTheme();
  const reviews = useInfiniteQuery({
    queryKey: ['product', productId, 'reviews'],
    queryFn: ({ pageParam }) => api.productReviews(productId, pageParam),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.reviews.length === last.pageSize ? last.page + 1 : undefined),
  });
  const first = reviews.data?.pages[0];
  const items = reviews.data?.pages.flatMap((page) => page.reviews) ?? [];

  return (
    <ThemedView style={styles.fill}>
      <Stack.Screen options={{ title: 'Reviews' }} />
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ReviewItem review={item} />}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          first && first.averageRating != null ? (
            <View style={[styles.summary, { borderBottomColor: theme.border }]}>
              <ThemedText style={styles.big}>{formatRating(first.averageRating)}</ThemedText>
              <View style={styles.summaryText}>
                <Stars value={first.averageRating} size={18} />
                <ThemedText type="small" themeColor="textSecondary">
                  {formatPlural(first.reviewCount, 'review', 'reviews')}
                </ThemedText>
              </View>
            </View>
          ) : null
        }
        ListEmptyComponent={
          reviews.isPending ? (
            <LoadingState />
          ) : reviews.error ? (
            <ErrorState message={reviews.error.message} onRetry={() => void reviews.refetch()} />
          ) : (
            <EmptyState title="No reviews yet" message="Students who complete half a course can review it." />
          )
        }
        ListFooterComponent={reviews.isFetchingNextPage ? <ActivityIndicator color={theme.primary} style={styles.more} /> : null}
        onEndReached={() => {
          if (reviews.hasNextPage && !reviews.isFetchingNextPage) void reviews.fetchNextPage();
        }}
        onEndReachedThreshold={0.5}
      />
    </ThemedView>
  );
}

function ReviewItem({ review }: { review: ProductReview }) {
  const theme = useTheme();
  return (
    <View style={[styles.review, { borderBottomColor: theme.border }]}>
      <View style={styles.reviewer}>
        <Avatar name={review.reviewerName} image={review.reviewerImage} size={36} />
        <View style={styles.flex}>
          <ThemedText type="smallBold">{review.reviewerName}</ThemedText>
          <View style={styles.inline}>
            <Stars value={review.rating} size={12} />
            <ThemedText type="small" themeColor="textSecondary">
              {formatDate(review.createdAt)}
            </ThemedText>
          </View>
        </View>
      </View>
      {review.content ? <ThemedText>{review.content}</ThemedText> : null}
      {review.instructorReply ? (
        <ThemedView type="backgroundElement" style={styles.reply}>
          <ThemedText type="smallBold">Instructor reply</ThemedText>
          <ThemedText type="small">{review.instructorReply}</ThemedText>
        </ThemedView>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  flex: { flex: 1 },
  list: { padding: Spacing.four, width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center' },
  summary: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, paddingBottom: Spacing.four, borderBottomWidth: StyleSheet.hairlineWidth },
  big: { fontSize: 48, lineHeight: 56, fontWeight: '700' },
  summaryText: { gap: Spacing.one },
  review: { gap: Spacing.two, paddingVertical: Spacing.four, borderBottomWidth: StyleSheet.hairlineWidth },
  reviewer: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  inline: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  reply: { borderRadius: 12, padding: Spacing.three, gap: 4 },
  more: { marginVertical: Spacing.four },
});
