import { router, Stack } from 'expo-router';
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, View, type TextInput } from 'react-native';

import { useAuth } from '@/auth/auth-context';
import { AuthScreen, closeAuth } from '@/components/auth-screen';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { FormMessage } from '@/components/ui/form-message';
import { TextField } from '@/components/ui/text-field';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function SignInScreen() {
  const { signIn } = useAuth();
  const theme = useTheme();
  const passwordRef = useRef<TextInput>(null);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = identifier.trim().length > 0 && password.length > 0 && !submitting;

  async function submit() {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      await signIn(identifier, password);
      closeAuth();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.');
      setSubmitting(false);
    }
  }

  return (
    <AuthScreen title="Welcome back" subtitle="Sign in with your email or username.">
      <Stack.Screen options={{ title: 'Sign in' }} />
      <TextField
        label="Email or username"
        value={identifier}
        onChangeText={setIdentifier}
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="username"
        textContentType="username"
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
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="current-password"
        textContentType="password"
        returnKeyType="go"
        onSubmitEditing={submit}
        editable={!submitting}
      />
      <Pressable onPress={() => router.replace('/forgot-password')} hitSlop={8} style={styles.forgot}>
        <ThemedText type="small" style={{ color: theme.primary }}>
          Forgot password?
        </ThemedText>
      </Pressable>
      <FormMessage message={error} />
      <Button title="Sign in" onPress={submit} loading={submitting} disabled={!canSubmit} />
      <View style={styles.footer}>
        <ThemedText type="small" themeColor="textSecondary">
          New to Chiyali?
        </ThemedText>
        <Pressable onPress={() => router.replace('/sign-up')} hitSlop={8}>
          <ThemedText type="smallBold" style={{ color: theme.primary }}>
            Create an account
          </ThemedText>
        </Pressable>
      </View>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  forgot: { alignSelf: 'flex-end' },
  footer: { flexDirection: 'row', justifyContent: 'center', gap: Spacing.one, marginTop: Spacing.two },
});
