import {
  PASSWORD_MAX_LENGTH,
  PASSWORD_RULES_ATTRIBUTE,
  USERNAME_MAX_LENGTH,
  USERNAME_MIN_LENGTH,
  USERNAME_PATTERN,
  checkPassword,
} from '@repo/password-policy';
import { router, Stack } from 'expo-router';
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, View, type TextInput } from 'react-native';

import { useAuth } from '@/auth/auth-context';
import { AuthScreen, closeAuth } from '@/components/auth-screen';
import { PasswordChecklist } from '@/components/password-checklist';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { FormMessage } from '@/components/ui/form-message';
import { TextField } from '@/components/ui/text-field';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type UsernameState = 'idle' | 'checking' | 'available' | 'taken';

function usernameProblem(username: string) {
  if (username.length === 0) return null;
  if (!USERNAME_PATTERN.test(username)) return 'Letters, numbers, dots and underscores only.';
  if (username.length < USERNAME_MIN_LENGTH) return `At least ${USERNAME_MIN_LENGTH} characters.`;
  return null;
}

export default function SignUpScreen() {
  const { signUp, isUsernameAvailable } = useAuth();
  const theme = useTheme();
  const usernameRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [usernameState, setUsernameState] = useState<UsernameState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const usernameError = usernameProblem(username);
  const passwordOk = checkPassword(password, { name, email, username }).ok;
  const canSubmit =
    name.trim().length >= 2 &&
    username.length > 0 &&
    usernameError == null &&
    usernameState !== 'taken' &&
    email.trim().length > 0 &&
    passwordOk &&
    !submitting;

  async function checkUsername() {
    if (!username || usernameError) return;
    setUsernameState('checking');
    try {
      setUsernameState((await isUsernameAvailable(username)) ? 'available' : 'taken');
    } catch {
      setUsernameState('idle');
    }
  }

  async function submit() {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      await signUp({ name, username, email, password });
      closeAuth();
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Something went wrong. Please try again.';
      if (message === 'That username is taken.') setUsernameState('taken');
      setError(message);
      setSubmitting(false);
    }
  }

  const usernameHint =
    usernameState === 'taken'
      ? null
      : usernameState === 'available'
        ? 'Available.'
        : usernameState === 'checking'
          ? 'Checking…'
          : 'You can sign in with this or your email.';

  return (
    <AuthScreen title="Create an account" subtitle="Learn from Nepali instructors — browsing stays free, no account needed.">
      <Stack.Screen options={{ title: 'Sign up' }} />
      <TextField
        label="Full name"
        value={name}
        onChangeText={setName}
        autoComplete="name"
        textContentType="name"
        returnKeyType="next"
        onSubmitEditing={() => usernameRef.current?.focus()}
        editable={!submitting}
      />
      <TextField
        ref={usernameRef}
        label="Username"
        value={username}
        onChangeText={(v) => {
          setUsername(v.trim());
          setUsernameState('idle');
        }}
        onBlur={checkUsername}
        maxLength={USERNAME_MAX_LENGTH}
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="username-new"
        textContentType="username"
        returnKeyType="next"
        onSubmitEditing={() => emailRef.current?.focus()}
        error={usernameError ?? (usernameState === 'taken' ? 'That username is taken.' : null)}
        hint={usernameHint}
        editable={!submitting}
      />
      <TextField
        ref={emailRef}
        label="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
        textContentType="emailAddress"
        keyboardType="email-address"
        returnKeyType="next"
        onSubmitEditing={() => passwordRef.current?.focus()}
        editable={!submitting}
      />
      <TextField
        ref={passwordRef}
        label="Password"
        secure
        value={password}
        onChangeText={setPassword}
        maxLength={PASSWORD_MAX_LENGTH}
        autoCapitalize="none"
        autoCorrect={false}
        // iOS / Android password managers offer and save a password; on iOS
        // the Keychain's generated password follows these rules.
        autoComplete="new-password"
        textContentType="newPassword"
        passwordRules={PASSWORD_RULES_ATTRIBUTE}
        returnKeyType="go"
        onSubmitEditing={submit}
        editable={!submitting}
      />
      <PasswordChecklist password={password} context={{ name, email, username }} />
      <ThemedView type="backgroundElement" style={styles.managerNote}>
        <ThemedText type="small" themeColor="textSecondary">
          <ThemedText type="smallBold">Use a password manager.</ThemedText> Let your phone suggest a strong password
          when you tap the field, and it will remember it for you.
        </ThemedText>
      </ThemedView>
      <FormMessage message={error} />
      <Button title="Create account" onPress={submit} loading={submitting} disabled={!canSubmit} />
      <View style={styles.footer}>
        <ThemedText type="small" themeColor="textSecondary">
          Already have an account?
        </ThemedText>
        <Pressable onPress={() => router.replace('/sign-in')} hitSlop={8}>
          <ThemedText type="smallBold" style={{ color: theme.primary }}>
            Sign in
          </ThemedText>
        </Pressable>
      </View>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  managerNote: { borderRadius: 12, padding: Spacing.three },
  footer: { flexDirection: 'row', justifyContent: 'center', gap: Spacing.one, marginTop: Spacing.two },
});
