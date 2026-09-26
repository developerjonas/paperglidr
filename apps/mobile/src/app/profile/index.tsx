import { useQuery } from '@tanstack/react-query';
import { router, Stack } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { keys } from '@/api/keys';
import { api } from '@/api/v1';
import { useAuth } from '@/auth/auth-context';
import { RequireAuth } from '@/components/require-auth';
import { ThemedText } from '@/components/themed-text';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { FormMessage } from '@/components/ui/form-message';
import { ListRow, ListSection } from '@/components/ui/list';
import { Screen } from '@/components/ui/screen';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const METHOD_LABELS: Record<string, string> = {
  credential: 'Email and password',
  google: 'Google',
  github: 'GitHub',
};

export default function ProfileScreen() {
  return (
    <RequireAuth reason="see your profile" title="Profile">
      <Profile />
    </RequireAuth>
  );
}

function Profile() {
  const theme = useTheme();
  const { listSignInMethods } = useAuth();
  const me = useQuery({ queryKey: keys.me.profile, queryFn: api.me });
  const methods = useQuery({ queryKey: keys.me.signInMethods, queryFn: listSignInMethods });

  const hasPassword = methods.data?.includes('credential') ?? false;
  const refreshing = me.isRefetching || methods.isRefetching;

  return (
    <>
      <Stack.Screen options={{ title: 'Profile' }} />
      <Screen
        refreshing={refreshing}
        onRefresh={() => {
          void me.refetch();
          void methods.refetch();
        }}>
        {me.isPending ? (
          <ActivityIndicator color={theme.primary} />
        ) : me.error ? (
          <>
            <FormMessage message={me.error.message} />
            <Button title="Try again" variant="outline" onPress={() => void me.refetch()} />
          </>
        ) : (
          <>
            <View style={styles.header}>
              <Avatar name={me.data.name} image={me.data.image} size={88} />
              <ThemedText type="subtitle" style={styles.center}>
                {me.data.name}
              </ThemedText>
              {me.data.displayUsername || me.data.username ? (
                <ThemedText themeColor="textSecondary">@{me.data.displayUsername ?? me.data.username}</ThemedText>
              ) : null}
            </View>

            <ListSection title="Details">
              <ListRow label="Name" value={me.data.name} />
              <ListRow
                label="Username"
                value={me.data.username ? `@${me.data.displayUsername ?? me.data.username}` : 'Not set'}
              />
              <ListRow label="Email" value={me.data.email} />
              <ListRow label="Email verified" value={me.data.emailVerified ? 'Yes' : 'Not yet'} />
              <ListRow
                label="Member since"
                value={new Date(me.data.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                last
              />
            </ListSection>

            <ListSection title="How you sign in">
              {methods.isPending ? (
                <ListRow label="Loading…" last />
              ) : methods.error ? (
                <ListRow label="Couldn't load sign-in methods" tone="danger" onPress={() => void methods.refetch()} last />
              ) : (
                methods.data.map((method, index) => (
                  <ListRow
                    key={method}
                    label={METHOD_LABELS[method] ?? method}
                    value={method === 'credential' ? (me.data.username ? 'Email or username' : 'Email') : undefined}
                    last={index === methods.data.length - 1}
                  />
                ))
              )}
            </ListSection>

            {me.data.instructor ? (
              <ListSection title="Teaching">
                <ListRow
                  label="Your instructor profile"
                  value={`@${me.data.instructor.handle}`}
                  onPress={() => router.push(`/instructors/${me.data.instructor!.handle}`)}
                  last
                />
              </ListSection>
            ) : null}

            <View style={styles.actions}>
              <Button title="Edit profile" onPress={() => router.push('/profile/edit')} />
              <Button
                title={hasPassword || methods.isPending ? 'Change password' : 'Set a password'}
                variant="outline"
                onPress={() => router.push('/profile/change-password')}
              />
            </View>
          </>
        )}
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: 'center', gap: Spacing.two, marginTop: Spacing.two },
  center: { textAlign: 'center' },
  actions: { gap: Spacing.three },
});
