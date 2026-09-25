import { router, Stack } from 'expo-router';
import { useState } from 'react';

import { useAuth } from '@/auth/auth-context';
import { AuthScreen } from '@/components/auth-screen';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { FormMessage } from '@/components/ui/form-message';
import { TextField } from '@/components/ui/text-field';

/**
 * Emails a reset link. The link opens the website's reset page (the
 * password is set there, with the same rules), then the user signs in here.
 */
export default function ForgotPasswordScreen() {
  const { requestPasswordReset } = useAuth();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    if (!email.trim() || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await requestPasswordReset(email);
      setSent(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthScreen
      title="Forgot your password?"
      subtitle="Enter your account's email and we'll send you a link to choose a new one.">
      <Stack.Screen options={{ title: 'Forgot password' }} />
      {sent ? (
        <>
          <FormMessage
            tone="success"
            message={`If an account uses ${email.trim()}, we've sent it a reset link. It works once and expires in 1 hour.`}
          />
          <ThemedText type="small" themeColor="textSecondary">
            Open the link on this phone or any computer, choose a new password, then sign in here.
          </ThemedText>
          <Button title="Back to sign in" onPress={() => router.replace('/sign-in')} />
        </>
      ) : (
        <>
          <TextField
            label="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            textContentType="emailAddress"
            keyboardType="email-address"
            returnKeyType="send"
            onSubmitEditing={submit}
            editable={!submitting}
          />
          <FormMessage message={error} />
          <Button title="Send reset link" onPress={submit} loading={submitting} disabled={!email.trim()} />
          <Button title="Back to sign in" variant="outline" onPress={() => router.replace('/sign-in')} />
        </>
      )}
    </AuthScreen>
  );
}
