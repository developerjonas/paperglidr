import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { keys } from '@/api/keys';
import { api } from '@/api/v1';
import { RequireAuth } from '@/components/require-auth';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { FormMessage } from '@/components/ui/form-message';
import { Icon } from '@/components/ui/icon';
import { Screen } from '@/components/ui/screen';
import { TextField } from '@/components/ui/text-field';
import { Spacing } from '@/constants/theme';

const STAR = '#f59e0b';
const LABELS = ['', 'Poor', 'Fair', 'Good', 'Very good', 'Excellent'];

/** Write or edit your review of a course (modal). `rating` in the params = editing. */
export default function ReviewScreen() {
  const params = useLocalSearchParams<{ courseId: string; rating?: string; content?: string }>();
  const editing = params.rating != null;
  return (
    <RequireAuth reason="review this course" title={editing ? 'Edit review' : 'Write a review'}>
      <ReviewForm
        courseId={params.courseId}
        editing={editing}
        initialRating={Number(params.rating) || 0}
        initialContent={params.content ?? ''}
      />
    </RequireAuth>
  );
}

function ReviewForm({
  courseId,
  editing,
  initialRating,
  initialContent,
}: {
  courseId: string;
  editing: boolean;
  initialRating: number;
  initialContent: string;
}) {
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(initialRating);
  const [content, setContent] = useState(initialContent);

  const save = useMutation({
    mutationFn: () => {
      const review = { rating, content: content.trim() || undefined };
      return editing ? api.updateReview(courseId, review) : api.createReview(courseId, review);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: keys.courseReviews(courseId) });
      void queryClient.invalidateQueries({ queryKey: keys.me.course(courseId) });
      router.back();
    },
  });

  return (
    <>
      <Stack.Screen options={{ title: editing ? 'Edit review' : 'Write a review' }} />
      <Screen>
        <ThemedText type="subtitle">{editing ? 'Edit your review' : 'How was this course?'}</ThemedText>
        <View style={styles.stars} accessibilityRole="adjustable" accessibilityLabel={`Rating: ${rating} of 5`}>
          {[1, 2, 3, 4, 5].map((value) => (
            <Pressable
              key={value}
              accessibilityRole="button"
              accessibilityLabel={`${value} star${value === 1 ? '' : 's'}`}
              hitSlop={4}
              onPress={() => setRating(value)}>
              {value <= rating ? (
                <Icon ios="star.fill" android="star" size={36} color={STAR} />
              ) : (
                <Icon ios="star" android="star_border" size={36} color={STAR} />
              )}
            </Pressable>
          ))}
        </View>
        <ThemedText themeColor="textSecondary">{rating ? LABELS[rating] : 'Tap a star to rate'}</ThemedText>
        <TextField
          label="Your review (optional)"
          value={content}
          onChangeText={setContent}
          multiline
          maxLength={2000}
          placeholder="What did you like? What could be better?"
          style={styles.text}
        />
        {editing ? (
          <ThemedText type="small" themeColor="textSecondary">
            Editing removes the instructor&apos;s reply, if there is one.
          </ThemedText>
        ) : null}
        <FormMessage message={save.error ? save.error.message : null} />
        <Button
          title={editing ? 'Save review' : 'Post review'}
          onPress={() => save.mutate()}
          loading={save.isPending}
          disabled={rating === 0}
        />
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  stars: { flexDirection: 'row', gap: Spacing.two },
  text: { minHeight: 120, textAlignVertical: 'top' },
});
