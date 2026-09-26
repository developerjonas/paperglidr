import { useQuery } from '@tanstack/react-query';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { ApiError } from '@/api/client';
import { keys } from '@/api/keys';
import { api } from '@/api/v1';
import { CertificateDocument } from '@/components/certificates/certificate-document';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Screen } from '@/components/ui/screen';
import { ErrorState, LoadingState } from '@/components/ui/states';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { parseCertificateCode } from '@/lib/certificates';

const GREEN = '#059669';

/** The result, as the website's /verify/[code]: valid, revoked or not found. */
export default function VerifyResultScreen() {
  const { code: raw } = useLocalSearchParams<{ code: string }>();
  const theme = useTheme();
  const code = parseCertificateCode(raw ?? '');
  const result = useQuery({
    queryKey: keys.verifyCertificate(code ?? ''),
    queryFn: () => api.verifyCertificate(code!),
    enabled: code != null,
    retry: false,
  });
  const notFound = code == null || (result.error instanceof ApiError && result.error.status === 404);

  return (
    <>
      <Stack.Screen options={{ title: 'Certificate check' }} />
      <Screen>
        {notFound ? (
          <View style={styles.hero}>
            <Icon ios="xmark.circle.fill" android="cancel" size={56} color={theme.danger} />
            <ThemedText type="subtitle" style={styles.center}>
              Certificate not found
            </ThemedText>
            <ThemedText themeColor="textSecondary" style={styles.center}>
              No certificate matches code {raw}. Double check it was copied correctly.
            </ThemedText>
            <Button title="Scan or type another" variant="outline" onPress={() => router.back()} />
          </View>
        ) : result.isPending ? (
          <LoadingState />
        ) : result.error ? (
          <ErrorState message={result.error.message} onRetry={() => void result.refetch()} />
        ) : (
          <>
            <View style={styles.hero}>
              {result.data.isRevoked ? (
                <Icon ios="xmark.circle.fill" android="cancel" size={56} color={theme.danger} />
              ) : (
                <Icon ios="checkmark.circle.fill" android="check_circle" size={56} color={GREEN} />
              )}
              <ThemedText
                type="subtitle"
                style={[styles.center, { color: result.data.isRevoked ? theme.danger : GREEN }]}>
                {result.data.isRevoked ? 'This certificate has been revoked' : 'Valid certificate'}
              </ThemedText>
            </View>
            <CertificateDocument certificate={result.data} isRevoked={result.data.isRevoked} />
            <ThemedText themeColor="textSecondary" style={styles.center}>
              This page confirms <ThemedText type="smallBold">{result.data.userNameSnapshot}</ThemedText> completed{' '}
              <ThemedText type="smallBold">{result.data.courseTitleSnapshot}</ThemedText> on{' '}
              {new Date(result.data.issuedAt).toLocaleDateString()}.
            </ThemedText>
          </>
        )}
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', gap: Spacing.three, marginTop: Spacing.two },
  center: { textAlign: 'center' },
});
