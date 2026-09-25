import { router, Stack } from 'expo-router';
import type { ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { useAuth } from '@/auth/auth-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/**
 * Shows `children` only when signed in. Signed out, it explains why and
 * offers sign-in — nothing redirects, so browsing is never interrupted.
 */
export function RequireAuth({
  reason,
  title,
  children,
}: {
  reason: string;
  /** Header title while the prompt shows (pushed screens). */
  title?: string;
  children: ReactNode;
}) {
  const { status } = useAuth();
  const theme = useTheme();

  if (status === 'signedIn') return <>{children}</>;

  return (
    <ThemedView style={styles.fill}>
      {title ? <Stack.Screen options={{ title }} /> : null}
      {status === 'restoring' ? (
        <ActivityIndicator color={theme.primary} />
      ) : (
        <View style={styles.column}>
          <ThemedText type="subtitle" style={styles.center}>
            Sign in to {reason}
          </ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.center}>
            Browsing courses doesn&apos;t need an account — this part does.
          </ThemedText>
          <Button title="Sign in" onPress={() => router.push('/sign-in')} />
          <Button title="Create an account" variant="outline" onPress={() => router.push('/sign-up')} />
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.four },
  column: { width: '100%', maxWidth: MaxContentWidth, gap: Spacing.three },
  center: { textAlign: 'center' },
});
