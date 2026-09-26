import { useQuery } from '@tanstack/react-query';
import { Stack, useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { Share } from 'react-native';

import { keys } from '@/api/keys';
import { api } from '@/api/v1';
import { CertificateDocument } from '@/components/certificates/certificate-document';
import { RequireAuth } from '@/components/require-auth';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { FormMessage } from '@/components/ui/form-message';
import { Screen } from '@/components/ui/screen';
import { ErrorState, LoadingState } from '@/components/ui/states';

export default function CertificateScreen() {
  return (
    <RequireAuth reason="see this certificate" title="Certificate">
      <CertificateView />
    </RequireAuth>
  );
}

/** One certificate, with the QR anyone can scan to check it, and sharing. */
function CertificateView() {
  const { certificateId } = useLocalSearchParams<{ certificateId: string }>();
  const certificate = useQuery({
    queryKey: keys.me.certificate(certificateId),
    queryFn: () => api.certificate(certificateId),
  });

  if (certificate.isPending) return <><Stack.Screen options={{ title: 'Certificate' }} /><LoadingState /></>;
  if (certificate.error) {
    return (
      <>
        <Stack.Screen options={{ title: 'Certificate' }} />
        <ErrorState message={certificate.error.message} onRetry={() => void certificate.refetch()} />
      </>
    );
  }
  const c = certificate.data;
  const revoked = c.revokedAt != null;

  return (
    <>
      <Stack.Screen options={{ title: 'Certificate' }} />
      <Screen>
        {revoked ? (
          <FormMessage message={`This certificate has been revoked${c.revokedReason ? `: ${c.revokedReason}` : '.'}`} />
        ) : null}
        <CertificateDocument
          certificate={{ ...c, userNameSnapshot: c.userNameSnapshot ?? '' }}
          isRevoked={revoked}
          qrValue={c.verifyUrl}
        />
        <ThemedText type="small" themeColor="textSecondary">
          Anyone can check this certificate by scanning the QR code or opening its verification page.
        </ThemedText>
        {!revoked ? (
          <Button
            title="Share certificate"
            onPress={() =>
              void Share.share({
                message: `I completed "${c.courseTitleSnapshot}" on Chiyali. Verify my certificate: ${c.verifyUrl}`,
                url: c.verifyUrl,
              })
            }
          />
        ) : null}
        <Button title="Open verification page" variant="outline" onPress={() => void WebBrowser.openBrowserAsync(c.verifyUrl)} />
      </Screen>
    </>
  );
}
