import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { keys } from '@/api/keys';
import type { LessonQuestion, QuestionAuthor } from '@/api/types';
import { api } from '@/api/v1';
import { RequireAuth } from '@/components/require-auth';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { FormMessage } from '@/components/ui/form-message';
import { Screen } from '@/components/ui/screen';
import { ErrorState, LoadingState } from '@/components/ui/states';
import { TextField } from '@/components/ui/text-field';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatDate } from '@/lib/format';

export default function LessonQuestionsScreen() {
  return (
    <RequireAuth reason="see the questions and answers" title="Q&A">
      <Questions />
    </RequireAuth>
  );
}

/** The lesson's Q&A, as on the website: ask (students), reply (students and the instructor). */
function Questions() {
  const { lessonId } = useLocalSearchParams<{ lessonId: string }>();
  const queryClient = useQueryClient();
  const questions = useQuery({ queryKey: keys.me.lessonQuestions(lessonId), queryFn: () => api.lessonQuestions(lessonId) });
  const lesson = useQuery({ queryKey: keys.me.lesson(lessonId), queryFn: () => api.lesson(lessonId) });
  const courseId = lesson.data?.courseId;
  // Having the course (or being its author) is what the server requires to post.
  const access = useQuery({
    queryKey: keys.me.course(courseId ?? ''),
    queryFn: () => api.myCourse(courseId!),
    enabled: courseId != null,
    retry: false,
  });
  const canPost = access.isSuccess;

  const [body, setBody] = useState('');
  const ask = useMutation({
    mutationFn: () => api.askQuestion(lessonId, body.trim()),
    onSuccess: () => {
      setBody('');
      void queryClient.invalidateQueries({ queryKey: keys.me.lessonQuestions(lessonId) });
    },
  });

  return (
    <>
      <Stack.Screen options={{ title: 'Questions & Answers' }} />
      <Screen refreshing={questions.isRefetching} onRefresh={() => void questions.refetch()}>
        {lesson.data ? (
          <ThemedText type="small" themeColor="textSecondary">
            {lesson.data.name}
          </ThemedText>
        ) : null}

        {canPost ? (
          <View style={styles.form}>
            <TextField
              label="Ask a question"
              value={body}
              onChangeText={setBody}
              placeholder="Ask a question about this lesson..."
              multiline
              maxLength={2000}
              style={styles.input}
              hint="At least 10 characters."
            />
            <FormMessage message={ask.error ? ask.error.message : null} />
            <Button
              title={ask.isPending ? 'Posting...' : 'Ask question'}
              onPress={() => ask.mutate()}
              loading={ask.isPending}
              disabled={body.trim().length < 10}
            />
          </View>
        ) : access.isError ? (
          <ThemedText type="small" themeColor="textSecondary">
            Only students who have this course can ask questions.
          </ThemedText>
        ) : null}

        {questions.isPending ? (
          <LoadingState />
        ) : questions.error ? (
          <ErrorState message={questions.error.message} onRetry={() => void questions.refetch()} />
        ) : questions.data.length === 0 ? (
          <ThemedText themeColor="textSecondary">No questions yet for this lesson. Be the first to ask.</ThemedText>
        ) : (
          questions.data.map((question) => (
            <Question key={question.id} question={question} lessonId={lessonId} canReply={canPost} />
          ))
        )}
      </Screen>
    </>
  );
}

function Question({ question, lessonId, canReply }: { question: LessonQuestion; lessonId: string; canReply: boolean }) {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState('');
  const reply = useMutation({
    mutationFn: () => api.replyToQuestion(question.id, body.trim()),
    onSuccess: () => {
      setBody('');
      setOpen(false);
      void queryClient.invalidateQueries({ queryKey: keys.me.lessonQuestions(lessonId) });
    },
  });

  return (
    <ThemedView style={[styles.question, { borderColor: theme.border }]}>
      <Post author={question.author} body={question.body} createdAt={question.createdAt} />
      {question.replies.length > 0 ? (
        <View style={[styles.replies, { borderLeftColor: theme.border }]}>
          {question.replies.map((r) => (
            <Post key={r.id} author={r.author} body={r.body} createdAt={r.createdAt} />
          ))}
        </View>
      ) : null}
      {canReply ? (
        open ? (
          <View style={styles.form}>
            <TextField
              label="Reply"
              value={body}
              onChangeText={setBody}
              placeholder="Write a reply..."
              multiline
              maxLength={2000}
              style={styles.input}
            />
            <FormMessage message={reply.error ? reply.error.message : null} />
            <View style={styles.row}>
              <Button title="Cancel" variant="outline" style={styles.flex} onPress={() => setOpen(false)} />
              <Button
                title="Reply"
                style={styles.flex}
                loading={reply.isPending}
                disabled={body.trim().length === 0}
                onPress={() => reply.mutate()}
              />
            </View>
          </View>
        ) : (
          <Button title="Reply" variant="outline" onPress={() => setOpen(true)} />
        )
      ) : null}
    </ThemedView>
  );
}

function Post({ author, body, createdAt }: { author: QuestionAuthor; body: string; createdAt: string }) {
  const theme = useTheme();
  return (
    <View style={styles.post}>
      <View style={styles.row}>
        <Avatar name={author.name} image={author.image} size={28} />
        <ThemedText type="smallBold">{author.isMine ? `${author.name} (you)` : author.name}</ThemedText>
        {author.isInstructor ? (
          <View style={[styles.badge, { backgroundColor: theme.backgroundSelected }]}>
            <ThemedText type="small" style={styles.badgeText}>
              Instructor
            </ThemedText>
          </View>
        ) : null}
      </View>
      <ThemedText>{body}</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        {formatDate(createdAt)}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: Spacing.two },
  input: { minHeight: 90, textAlignVertical: 'top' },
  question: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 14, padding: Spacing.three, gap: Spacing.three },
  replies: { borderLeftWidth: 2, paddingLeft: Spacing.three, gap: Spacing.three },
  post: { gap: Spacing.one },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  flex: { flex: 1 },
  badge: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 1 },
  badgeText: { fontSize: 11, fontWeight: '600' },
});
