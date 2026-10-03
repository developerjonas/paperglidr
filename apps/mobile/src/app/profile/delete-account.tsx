import { useMutation } from '@tanstack/react-query';
import { router, Stack } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import { Alert, Platform, StyleSheet, View } from 'react-native';

import { API_URL } from '@/api/config';
import { useAuth } from '@/auth/auth-context';
import { RequireAuth } from '@/components/require-auth';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { FormMessage } from '@/components/ui/form-message';
import { Screen } from '@/components/ui/screen';
import { TextField } from '@/components/ui/text-field';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// What the server asks for (features/users/lib/deleteAccount.ts on the web).
const CONFIRMATION = 'DELETE';

export default function DeleteAccountScreen() {
  return (
    <RequireAuth reason="delete your account" title="Delete account">
      <DeleteAccount />
    </RequireAuth>
  );
}

/** Same rules and wording as the website's /account/delete. */
function DeleteAccount() {
  const theme = useTheme();
  const { deleteAccount } = useAuth();
  const [value, setValue] = useState('');

  const remove = useMutation({
    mutationFn: () => deleteAccount(value),
    onSuccess: () => {
      router.dismissAll();
      router.replace('/');
      const message = "You've been signed out on every device. Thank you for learning with us.";
      if (Platform.OS === 'web') console.info(message);
      else Alert.alert('Account deleted', message);
    },
  });

  return (
    <>
      <Stack.Screen options={{ title: 'Delete account' }} />
      <Screen>
        <ThemedText type="subtitle">Delete your account</ThemedText>
        <ThemedText themeColor="textSecondary">
          This permanently closes your Chiyali account, on the website and in the app. It can&apos;t be undone.
        </ThemedText>

        <ThemedView type="backgroundElement" style={[styles.card, { borderColor: theme.border }]}>
          <ThemedText type="smallBold">Deleted now</ThemedText>
          <Bullets
            items={[
              'Your name, email, username and photo',
              'Your password and Google/GitHub sign-in',
              'Access to your courses, and your progress',
              'Your wishlist',
              "You're signed out on every device",
            ]}
          />
          <ThemedText type="smallBold" style={styles.gap}>
            Kept
          </ThemedText>
          <Bullets
            items={[
              "Purchase, invoice and refund records, as Nepal's tax law requires",
              'Your reviews and questions, shown as "Deleted user"',
              'Certificates already issued, so ones you shared still verify',
            ]}
          />
        </ThemedView>

        <ThemedText type="small" themeColor="textSecondary">
          Courses you bought can&apos;t be moved to another account or refunded by deleting it. If you want a refund,
          ask for it first on the website, from My Purchases.
        </ThemedText>

        <TextField
          label={`Type ${CONFIRMATION} to confirm`}
          value={value}
          onChangeText={setValue}
          autoCapitalize="characters"
          autoCorrect={false}
          autoComplete="off"
        />
        <FormMessage message={remove.error ? remove.error.message : null} />
        <Button
          title="Permanently delete my account"
          variant="danger"
          loading={remove.isPending}
          disabled={value.trim() !== CONFIRMATION}
          onPress={() => remove.mutate()}
        />

        <ThemedText type="small" themeColor="textSecondary">
          Can&apos;t do it here? You can also delete your account on the website.
        </ThemedText>
        <Button
          title="Open on the website"
          variant="outline"
          onPress={() => void WebBrowser.openBrowserAsync(`${API_URL}/account/delete`)}
        />
      </Screen>
    </>
  );
}

function Bullets({ items }: { items: string[] }) {
  return (
    <View style={styles.list}>
      {items.map((item) => (
        <ThemedText key={item} type="small" themeColor="textSecondary">
          • {item}
        </ThemedText>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, padding: Spacing.three, gap: Spacing.one },
  list: { gap: 2 },
  gap: { marginTop: Spacing.two },
});
