import { PASSWORD_MAX_LENGTH, PASSWORD_RULES_ATTRIBUTE, checkPassword } from '@repo/password-policy';
import { useQuery } from '@tanstack/react-query';
import { router, Stack } from 'expo-router';
import { useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Switch, View, type TextInput } from 'react-native';

import { keys } from '@/api/keys';
import { useAuth } from '@/auth/auth-context';
import { PasswordChecklist } from '@/components/password-checklist';
import { RequireAuth } from '@/components/require-auth';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { FormMessage } from '@/components/ui/form-message';
import { Screen } from '@/components/ui/screen';
import { TextField } from '@/components/ui/text-field';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function ChangePasswordScreen() {
  return (
    <RequireAuth reason="change your password" title="Change password">
      <ChangePassword />
    </RequireAuth>
  );
}

function ChangePassword() {
  const theme = useTheme();
  const { listSignInMethods } = useAuth();
  const methods = useQuery({ queryKey: keys.me.signInMethods, queryFn: listSignInMethods });

  return (
    <>
      <Stack.Screen options={{ title: 'Change password' }} />
      <Screen>
        {methods.isPending ? (
          <ActivityIndicator color={theme.primary} />
        ) : methods.error ? (
          <>
            <FormMessage message={methods.error.message} />
            <Button title="Try again" variant="outline" onPress={() => void methods.refetch()} />
          </>
        ) : methods.data.includes('credential') ? (
          <ChangePasswordForm />
        ) : (
          <NoPasswordYet />
        )}
      </Screen>
    </>
  );
}

/** Google/GitHub-only accounts set their first password through the reset email. */
function NoPasswordYet() {
  const { user } = useAuth();
  return (
    <>
      <ThemedText type="subtitle">Set a password</ThemedText>
      <ThemedText themeColor="textSecondary">
        You sign in with Google or GitHub, so this account has no password yet. To add one, we&apos;ll email a
        link to {user?.email ?? 'your email'} where you can choose it — then you can also sign in with your email
        or username.
      </ThemedText>
      <Button title="Email me a link" onPress={() => router.push('/forgot-password')} />
    </>
  );
}

function ChangePasswordForm() {
  const { user, changePassword } = useAuth();
  const theme = useTheme();
  const newRef = useRef<TextInput>(null);
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [signOutOthers, setSignOutOthers] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);

  const context = { name: user?.name, email: user?.email, username: user?.username ?? undefined };
  const sameAsCurrent = next.length > 0 && next === current;
  const canSave = current.length > 0 && checkPassword(next, context).ok && !sameAsCurrent && !saving;

  async function save() {
    if (!canSave) return;
    setSaving(true);
    setError(null);
    try {
      await changePassword({ currentPassword: current, newPassword: next, signOutOtherDevices: signOutOthers });
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  if (done) {
    return (
      <>
        <FormMessage
          tone="success"
          message={
            signOutOthers
              ? 'Password changed. Every other device was signed out.'
              : 'Password changed.'
          }
        />
        <ThemedText themeColor="textSecondary">Make sure your password manager saved the new one.</ThemedText>
        <Button title="Done" onPress={() => router.back()} />
      </>
    );
  }

  return (
    <>
      <TextField
        label="Current password"
        secure
        value={current}
        onChangeText={setCurrent}
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="current-password"
        textContentType="password"
        returnKeyType="next"
        onSubmitEditing={() => newRef.current?.focus()}
        editable={!saving}
      />
      <TextField
        ref={newRef}
        label="New password"
        secure
        value={next}
        onChangeText={setNext}
        maxLength={PASSWORD_MAX_LENGTH}
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="new-password"
        textContentType="newPassword"
        passwordRules={PASSWORD_RULES_ATTRIBUTE}
        error={sameAsCurrent ? "It can't be the same as your current password." : null}
        editable={!saving}
      />
      <PasswordChecklist password={next} context={context} />
      <View style={styles.switchRow}>
        <View style={styles.switchText}>
          <ThemedText type="smallBold">Sign out of other devices</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Recommended if you think someone else knows your old password.
          </ThemedText>
        </View>
        <Switch
          value={signOutOthers}
          onValueChange={setSignOutOthers}
          trackColor={{ true: theme.primary, false: theme.backgroundSelected }}
          accessibilityLabel="Sign out of other devices"
        />
      </View>
      <FormMessage message={error} />
      <Button title="Change password" onPress={save} loading={saving} disabled={!canSave} />
      <ThemedText type="small" themeColor="textSecondary" style={styles.center}>
        Forgot your current password? Sign out and use &quot;Forgot password&quot;.
      </ThemedText>
    </>
  );
}

const styles = StyleSheet.create({
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  switchText: { flex: 1, gap: Spacing.half },
  center: { textAlign: 'center' },
});
