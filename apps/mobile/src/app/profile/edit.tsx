import { USERNAME_MAX_LENGTH, USERNAME_MIN_LENGTH, USERNAME_PATTERN } from '@repo/password-policy';
import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator } from 'react-native';

import { useAuth } from '@/auth/auth-context';
import { RequireAuth } from '@/components/require-auth';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { FormMessage } from '@/components/ui/form-message';
import { Screen } from '@/components/ui/screen';
import { TextField } from '@/components/ui/text-field';
import { useTheme } from '@/hooks/use-theme';

export default function EditProfileScreen() {
  return (
    <RequireAuth reason="edit your profile" title="Edit profile">
      <EditProfile />
    </RequireAuth>
  );
}

function EditProfile() {
  const { user } = useAuth();
  const theme = useTheme();
  // The form starts from the loaded profile; render it once that's here.
  if (!user) return <ActivityIndicator color={theme.primary} style={{ marginTop: 48 }} />;
  return <EditProfileForm initialName={user.name} initialUsername={user.displayUsername ?? user.username ?? ''} />;
}

function usernameProblem(username: string) {
  if (!USERNAME_PATTERN.test(username)) return 'Letters, numbers, dots and underscores only.';
  if (username.length < USERNAME_MIN_LENGTH) return `At least ${USERNAME_MIN_LENGTH} characters.`;
  return null;
}

function EditProfileForm({ initialName, initialUsername }: { initialName: string; initialUsername: string }) {
  const { updateProfile, isUsernameAvailable } = useAuth();
  const [name, setName] = useState(initialName);
  const [username, setUsername] = useState(initialUsername);
  const [usernameTaken, setUsernameTaken] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const nameChanged = name.trim() !== initialName;
  const usernameChanged = username !== initialUsername;
  // Case-only changes are the same username (stored lowercase).
  const usernameNewForServer = username.toLowerCase() !== initialUsername.toLowerCase();
  const nameError = name.trim().length < 2 ? 'Enter your name.' : null;
  const usernameError = username.length === 0 ? 'Choose a username.' : usernameProblem(username);
  const canSave =
    (nameChanged || usernameChanged) && !nameError && !usernameError && !usernameTaken && !saving;

  async function checkUsername() {
    if (!usernameNewForServer || usernameError) return;
    try {
      setUsernameTaken(!(await isUsernameAvailable(username)));
    } catch {
      setUsernameTaken(false);
    }
  }

  async function save() {
    if (!canSave) return;
    setSaving(true);
    setError(null);
    try {
      await updateProfile({
        ...(nameChanged ? { name } : {}),
        ...(usernameChanged ? { username } : {}),
      });
      router.back();
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Something went wrong. Please try again.';
      if (message === 'That username is taken.') setUsernameTaken(true);
      setError(message);
      setSaving(false);
    }
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Edit profile' }} />
      <Screen>
        <TextField
          label="Full name"
          value={name}
          onChangeText={setName}
          autoComplete="name"
          textContentType="name"
          maxLength={100}
          error={nameChanged ? nameError : null}
          editable={!saving}
        />
        <TextField
          label="Username"
          value={username}
          onChangeText={(v) => {
            setUsername(v.trim());
            setUsernameTaken(false);
          }}
          onBlur={checkUsername}
          maxLength={USERNAME_MAX_LENGTH}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="username"
          textContentType="username"
          error={usernameChanged ? (usernameError ?? (usernameTaken ? 'That username is taken.' : null)) : null}
          hint="You can sign in with this or your email."
          editable={!saving}
        />
        <ThemedText type="small" themeColor="textSecondary">
          Your email can&apos;t be changed here. Contact support if you need to change it.
        </ThemedText>
        <FormMessage message={error} />
        <Button title="Save changes" onPress={save} loading={saving} disabled={!canSave} />
      </Screen>
    </>
  );
}
