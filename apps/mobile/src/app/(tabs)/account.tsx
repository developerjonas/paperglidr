import { router } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { useAuth } from '@/auth/auth-context';
import { confirmSignOut } from '@/components/sign-out';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ListRow, ListSection } from '@/components/ui/list';
import { Screen } from '@/components/ui/screen';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/**
 * The account hub. Works signed out too: policies, contact and certificate
 * verification don't need an account.
 */
export default function AccountScreen() {
  const { status, user, signOut } = useAuth();
  const theme = useTheme();
  const signedIn = status === 'signedIn';

  return (
    <Screen>
      <ThemedText type="subtitle">Account</ThemedText>

      {status === 'restoring' ? (
        <ActivityIndicator color={theme.primary} />
      ) : signedIn ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open your profile"
          onPress={() => router.push('/profile')}
          style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
          <ThemedView type="backgroundElement" style={[styles.profileCard, { borderColor: theme.border }]}>
            <Avatar name={user?.name ?? '…'} image={user?.image} size={56} />
            <View style={styles.profileText}>
              <ThemedText type="smallBold" style={styles.name} numberOfLines={1}>
                {user?.name ?? 'Loading…'}
              </ThemedText>
              {user?.displayUsername || user?.username ? (
                <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
                  @{user.displayUsername ?? user.username}
                </ThemedText>
              ) : null}
              <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
                {user?.email ?? ''}
              </ThemedText>
            </View>
            <ThemedText themeColor="textSecondary" style={styles.chevron}>
              ›
            </ThemedText>
          </ThemedView>
        </Pressable>
      ) : (
        <ThemedView type="backgroundElement" style={[styles.signedOutCard, { borderColor: theme.border }]}>
          <ThemedText themeColor="textSecondary">
            Sign in to see your courses, wishlist and certificates. Browsing doesn&apos;t need an account.
          </ThemedText>
          <Button title="Sign in" onPress={() => router.push('/sign-in')} />
          <Button title="Create an account" variant="outline" onPress={() => router.push('/sign-up')} />
        </ThemedView>
      )}

      {signedIn ? (
        <ListSection title="Your account">
          <ListRow label="Profile" onPress={() => router.push('/profile')} />
          <ListRow label="Edit profile" onPress={() => router.push('/profile/edit')} />
          <ListRow label="Change password" onPress={() => router.push('/profile/change-password')} />
          <ListRow label="My certificates" onPress={() => router.push('/certificates')} last />
        </ListSection>
      ) : null}

      <ListSection title="Help">
        {signedIn ? <ListRow label="Support tickets" onPress={() => router.push('/support')} /> : null}
        <ListRow label="Contact us" onPress={() => router.push('/contact')} last />
      </ListSection>

      <ListSection title="About Chiyali">
        <ListRow label="Verify a certificate" onPress={() => router.push('/verify')} />
        <ListRow label="Terms and policies" onPress={() => router.push('/legal')} last />
      </ListSection>

      {signedIn ? (
        <ListSection>
          <ListRow label="Sign out" tone="danger" onPress={() => confirmSignOut(signOut)} last />
        </ListSection>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },
  profileText: { flex: 1, gap: Spacing.half },
  name: { fontSize: 18 },
  chevron: { fontSize: 24 },
  signedOutCard: { gap: Spacing.three, padding: Spacing.three, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth },
});
