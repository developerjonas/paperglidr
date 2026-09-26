import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Alert, Platform, Pressable, StyleSheet, View } from 'react-native';

import { keys } from '@/api/keys';
import type { CourseReview, LearnerCourse } from '@/api/types';
import { api } from '@/api/v1';
import { useAuth } from '@/auth/auth-context';
import { Rating, Stars } from '@/components/catalog/rating';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatDate } from '@/lib/format';

/**
 * A course's reviews, as the website's course page: summary, your review
 * (edit / delete), "Write a review" once you've done 50% (otherwise how far
 * you are), then everyone else's.
 */
export function CourseReviewsSection({
  courseId,
  learner,
}: {
  courseId: string;
  /** The course player's data, when the viewer has the course. */
  learner?: LearnerCourse;
}) {
  const theme = useTheme();
  const { status } = useAuth();
  const queryClient = useQueryClient();
  const reviews = useQuery({ queryKey: keys.courseReviews(courseId), queryFn: () => api.courseReviews(courseId) });

  const remove = useMutation({
    mutationFn: () => api.deleteReview(courseId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: keys.courseReviews(courseId) });
      void queryClient.invalidateQueries({ queryKey: keys.me.course(courseId) });
    },
  });

  function confirmDelete() {
    if (Platform.OS === 'web') return remove.mutate();
    Alert.alert('Delete your review?', undefined, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => remove.mutate() },
    ]);
  }

  const mine = reviews.data?.reviews.find((r) => r.isMine);
  const others = reviews.data?.reviews.filter((r) => !r.isMine) ?? [];

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <ThemedText type="smallBold" style={styles.title}>
          Reviews
        </ThemedText>
        {reviews.data ? <Rating average={reviews.data.averageRating} count={reviews.data.reviewCount} size={14} /> : null}
      </View>

      {status !== 'signedIn' ? (
        <Pressable onPress={() => router.push('/sign-in')}>
          <ThemedText type="small" themeColor="textSecondary">
            <ThemedText type="small" style={{ color: theme.primary }}>
              Sign in
            </ThemedText>{' '}
            to write a review.
          </ThemedText>
        </Pressable>
      ) : mine ? (
        <ThemedView type="backgroundElement" style={styles.mine}>
          <ThemedText type="smallBold">Your review</ThemedText>
          <ReviewBody review={mine} />
          <View style={styles.actions}>
            <Button
              title="Edit"
              variant="outline"
              style={styles.actionButton}
              onPress={() =>
                router.push({
                  pathname: '/review',
                  params: { courseId, rating: String(mine.rating), content: mine.content ?? '' },
                })
              }
            />
            <Button title="Delete" variant="outline" style={styles.actionButton} loading={remove.isPending} onPress={confirmDelete} />
          </View>
        </ThemedView>
      ) : learner ? (
        learner.review.canWrite ? (
          <Button title="Write a review" variant="outline" onPress={() => router.push({ pathname: '/review', params: { courseId } })} />
        ) : (
          <ThemedText type="small" themeColor="textSecondary">
            Complete at least {learner.review.requiredPercent}% of the course to leave a review
            {learner.review.completionPercent > 0 ? ` (you're at ${learner.review.completionPercent}%)` : ''}.
          </ThemedText>
        )
      ) : null}

      {reviews.isPending ? (
        <ThemedText type="small" themeColor="textSecondary">
          Loading reviews…
        </ThemedText>
      ) : reviews.error ? (
        <ThemedText type="small" themeColor="textSecondary">
          Couldn&apos;t load reviews.
        </ThemedText>
      ) : others.length === 0 && !mine ? (
        <ThemedText type="small" themeColor="textSecondary">
          No reviews yet — be the first!
        </ThemedText>
      ) : (
        others.map((review) => (
          <View key={review.id} style={[styles.review, { borderTopColor: theme.border }]}>
            <ReviewBody review={review} />
          </View>
        ))
      )}
    </View>
  );
}

function ReviewBody({ review }: { review: CourseReview }) {
  return (
    <View style={styles.body}>
      <View style={styles.reviewer}>
        <Avatar name={review.reviewerName} image={review.reviewerImage} size={32} />
        <View style={styles.flex}>
          <ThemedText type="smallBold">{review.reviewerName}</ThemedText>
          <View style={styles.inline}>
            <Stars value={review.rating} size={12} />
            <ThemedText type="small" themeColor="textSecondary">
              {formatDate(review.createdAt)}
              {review.edited ? ' (edited)' : ''}
            </ThemedText>
          </View>
        </View>
      </View>
      {review.content ? <ThemedText type="small">{review.content}</ThemedText> : null}
      {review.instructorReply ? (
        <ThemedView type="backgroundSelected" style={styles.reply}>
          <ThemedText type="smallBold">Instructor reply</ThemedText>
          <ThemedText type="small">{review.instructorReply}</ThemedText>
        </ThemedView>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: Spacing.three },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.two },
  title: { fontSize: 20, lineHeight: 26 },
  mine: { borderRadius: 14, padding: Spacing.three, gap: Spacing.two },
  actions: { flexDirection: 'row', gap: Spacing.two },
  actionButton: { flex: 1, minHeight: 40 },
  review: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: Spacing.three },
  body: { gap: Spacing.two },
  reviewer: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  flex: { flex: 1 },
  inline: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  reply: { borderRadius: 10, padding: Spacing.three, gap: 4 },
});
