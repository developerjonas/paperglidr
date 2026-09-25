import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Platform, StyleSheet, View } from 'react-native';

import { useAuth } from '@/auth/auth-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** Who's signed in, with Sign out — or Sign in / Create account. */
export function AccountSession() {
  const { status, user, signOut } = useAuth();
  const theme = useTheme();
  const [signingOut, setSigningOut] = useState(false);

  async function doSignOut() {
    setSigningOut(true);
    await signOut();
    setSigningOut(false);
  }

  function confirmSignOut() {
    if (Platform.OS === 'web') {
      void doSignOut();
      return;
    }
    Alert.alert('Sign out?', 'You can keep browsing courses signed out.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => void doSignOut() },
    ]);
  }

  return (
    <ThemedView type="backgroundElement" style={[styles.card, { borderColor: theme.border }]}>
      {status === 'restoring' ? (
        <ActivityIndicator color={theme.primary} />
      ) : status === 'signedIn' ? (
        <>
          {user ? (
            <View style={styles.who}>
              <ThemedText type="smallBold" style={{ fontSize: 18 }}>
                {user.name}
              </ThemedText>
              {user.displayUsername || user.username ? (
                <ThemedText type="small" themeColor="textSecondary">
                  @{user.displayUsername ?? user.username}
                </ThemedText>
              ) : null}
              <ThemedText type="small" themeColor="textSecondary">
                {user.email}
              </ThemedText>
            </View>
          ) : (
            <ThemedText type="small" themeColor="textSecondary">
              Signed in. Loading your profile…
            </ThemedText>
          )}
          <Button title="Sign out" variant="outline" onPress={confirmSignOut} loading={signingOut} />
        </>
      ) : (
        <>
          <ThemedText type="small" themeColor="textSecondary">
            Sign in to see your courses, wishlist and certificates.
          </ThemedText>
          <Button title="Sign in" onPress={() => router.push('/sign-in')} />
          <Button title="Create an account" variant="outline" onPress={() => router.push('/sign-up')} />
        </>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 14, padding: Spacing.three, gap: Spacing.three, marginTop: Spacing.three },
  who: { gap: Spacing.half },
});
