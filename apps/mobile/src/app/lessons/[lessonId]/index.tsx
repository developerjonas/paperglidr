import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useRef } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ApiError } from '@/api/client';
import { keys } from '@/api/keys';
import type { LessonAsset } from '@/api/types';
import { api } from '@/api/v1';
import { useAuth } from '@/auth/auth-context';
import { LessonPlayer } from '@/components/lesson/lesson-player';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { ListRow, ListSection } from '@/components/ui/list';
import { ErrorState, LoadingState } from '@/components/ui/states';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { neighbours } from '@/lib/course';

/**
 * One lesson, as the website's lesson page: the content, Previous / Mark
 * complete / Next, description (or the locked message), attachments,
 * report, and the lesson's Q&A. Free previews open for anyone.
 *
 * This screen may rotate (root layout): turned to landscape, the player
 * fills the screen. Only styles change, so the video keeps playing.
 */
export default function LessonScreen() {
  const { lessonId } = useLocalSearchParams<{ lessonId: string }>();
  const theme = useTheme();
  const window = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const landscape = Platform.OS !== 'web' && window.width > window.height;
  const scroll = useRef<ScrollView>(null);
  useEffect(() => {
    if (landscape) scroll.current?.scrollTo({ y: 0, animated: false });
  }, [landscape]);
  const { status } = useAuth();
  const queryClient = useQueryClient();
  const signedIn = status === 'signedIn';

  const lesson = useQuery({ queryKey: keys.me.lesson(lessonId), queryFn: () => api.lesson(lessonId) });
  const courseId = lesson.data?.courseId;
  // Your outline if you have the course (completion, every lesson), else the public one.
  const learner = useQuery({
    queryKey: keys.me.course(courseId ?? ''),
    queryFn: () => api.myCourse(courseId!),
    enabled: signedIn && courseId != null,
    retry: false,
  });
  const hasAccess = learner.isSuccess;
  const publicOutline = useQuery({
    queryKey: keys.course(courseId ?? ''),
    queryFn: () => api.course(courseId!),
    enabled: courseId != null && !hasAccess && (!signedIn || learner.isError),
  });
  const outline = learner.data ?? publicOutline.data;
  const { previous, next } = outline ? neighbours(outline, lessonId) : { previous: undefined, next: undefined };

  const complete = useMutation({
    mutationFn: (value: boolean) => api.setLessonComplete(lessonId, value),
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: keys.me.lesson(lessonId) });
      if (courseId) void queryClient.invalidateQueries({ queryKey: keys.me.course(courseId) });
      void queryClient.invalidateQueries({ queryKey: keys.me.courses });
      if (result.certificate) {
        void queryClient.invalidateQueries({ queryKey: keys.me.certificates });
        const certificateId = result.certificate.id;
        if (Platform.OS === 'web') router.push(`/certificates/${certificateId}`);
        else
          Alert.alert('Course complete!', 'You earned a certificate for this course.', [
            { text: 'Later', style: 'cancel' },
            { text: 'View certificate', onPress: () => router.push(`/certificates/${certificateId}`) },
          ]);
      }
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Couldn't update this lesson.";
      if (Platform.OS === 'web') console.warn(message);
      else Alert.alert('Lesson', message);
    },
  });

  if (lesson.isPending) return <Frame><LoadingState /></Frame>;

  if (lesson.error) {
    const status = lesson.error instanceof ApiError ? lesson.error.status : 0;
    return (
      <Frame>
        {status === 401 || status === 403 ? (
          <View style={styles.locked}>
            <View style={[styles.lockBadge, { backgroundColor: theme.primary }]}>
              <Icon ios="lock.fill" android="lock" size={36} color={theme.onPrimary} />
            </View>
            <ThemedText type="subtitle" style={styles.center}>
              {status === 401 ? 'Sign in to watch this lesson' : 'This lesson is locked'}
            </ThemedText>
            <ThemedText themeColor="textSecondary" style={styles.center}>
              {status === 401
                ? 'Free previews play for everyone; the rest of a course needs an account that has it.'
                : 'This lesson is locked. Please purchase the course to view it.'}
            </ThemedText>
            {status === 401 ? <Button title="Sign in" onPress={() => router.push('/sign-in')} /> : null}
          </View>
        ) : (
          <ErrorState message={lesson.error.message} onRetry={() => void lesson.refetch()} />
        )}
      </Frame>
    );
  }

  const l = lesson.data;
  const primary = l.assets.find((a) => a.role === 'primary');
  const attachments = l.assets.filter((a) => a.role === 'attachment');

  return (
    <ThemedView style={[styles.fill, landscape && styles.black]}>
      <Stack.Screen options={{ title: '', headerShown: !landscape, statusBarHidden: landscape }} />
      <ScrollView ref={scroll} scrollEnabled={!landscape} contentContainerStyle={styles.scroll}>
        <View
          style={
            landscape
              ? { width: window.width, height: window.height, paddingLeft: insets.left, paddingRight: insets.right }
              : styles.playerWrap
          }>
          <LessonPlayer
            asset={primary}
            fullscreen={landscape}
            onFinished={hasAccess && !l.isComplete ? () => complete.mutate(true) : undefined}
          />
        </View>

        <View style={[styles.column, landscape && styles.hidden]}>
          <View style={styles.titleRow}>
            <ThemedText type="subtitle" style={styles.title}>
              {l.name}
            </ThemedText>
            {l.isPreview ? (
              <View style={[styles.badge, { borderColor: theme.primary }]}>
                <ThemedText type="small" style={{ color: theme.primary }}>
                  Free preview
                </ThemedText>
              </View>
            ) : null}
          </View>

          {hasAccess ? (
            <Button
              title={l.isComplete ? 'Completed — mark incomplete' : 'Mark complete'}
              variant={l.isComplete ? 'outline' : 'primary'}
              loading={complete.isPending}
              onPress={() => complete.mutate(!l.isComplete)}
            />
          ) : null}

          <View style={styles.nav}>
            <Button
              title="‹ Previous"
              variant="outline"
              style={styles.navButton}
              disabled={!previous}
              onPress={() => previous && router.replace(`/lessons/${previous}`)}
            />
            <Button
              title="Next ›"
              variant="outline"
              style={styles.navButton}
              disabled={!next}
              onPress={() => next && router.replace(`/lessons/${next}`)}
            />
          </View>

          {l.description ? <ThemedText themeColor="textSecondary">{l.description}</ThemedText> : null}

          {attachments.length > 0 ? (
            <ListSection title="Attachments">
              {attachments.map((asset, index) => (
                <Attachment key={asset.id} asset={asset} last={index === attachments.length - 1} />
              ))}
            </ListSection>
          ) : null}

          <ListSection>
            <ListRow label="Questions & Answers" onPress={() => router.push(`/lessons/${l.id}/questions`)} />
            <ListRow
              label="Course outline"
              onPress={() => router.push(hasAccess ? `/learn/${l.courseId}` : `/courses/${l.courseId}`)}
              last
            />
          </ListSection>

          <Pressable
            onPress={() => router.push({ pathname: '/report', params: { targetType: 'lesson', targetId: l.id } })}
            style={styles.report}>
            <Icon ios="flag" android="flag" size={14} color={theme.textSecondary} />
            <ThemedText type="small" themeColor="textSecondary">
              Report this lesson
            </ThemedText>
          </Pressable>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

/** A downloadable file: a fresh signed link, opened in the in-app browser. */
function Attachment({ asset, last }: { asset: LessonAsset; last: boolean }) {
  async function open() {
    try {
      const delivery = await api.lessonAsset(asset.url);
      if ('url' in delivery) await WebBrowser.openBrowserAsync(delivery.url);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Couldn't open this file.";
      if (Platform.OS === 'web') console.warn(message);
      else Alert.alert('Attachment', message);
    }
  }
  const size = asset.fileSizeBytes ? `${Math.max(1, Math.round(asset.fileSizeBytes / 1024))} KB` : undefined;
  return <ListRow label={asset.fileName ?? 'Download attachment'} value={size} onPress={() => void open()} last={last} />;
}

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <ThemedView style={styles.fill}>
      <Stack.Screen options={{ title: 'Lesson' }} />
      {children}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  black: { backgroundColor: '#000' },
  hidden: { display: 'none' },
  scroll: { paddingBottom: Spacing.six, alignItems: 'center' },
  playerWrap: { width: '100%', maxWidth: MaxContentWidth },
  column: { width: '100%', maxWidth: MaxContentWidth, padding: Spacing.four, gap: Spacing.three },
  titleRow: { gap: Spacing.two },
  title: { fontSize: 24, lineHeight: 30 },
  badge: { alignSelf: 'flex-start', borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 2 },
  nav: { flexDirection: 'row', gap: Spacing.three },
  navButton: { flex: 1 },
  report: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', paddingVertical: Spacing.two },
  locked: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.five, gap: Spacing.three },
  lockBadge: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center' },
  center: { textAlign: 'center' },
});
