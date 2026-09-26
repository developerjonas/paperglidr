import { useQuery } from '@tanstack/react-query';
import { router, Stack } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { keys } from '@/api/keys';
import { api } from '@/api/v1';
import { RequireAuth } from '@/components/require-auth';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Screen } from '@/components/ui/screen';
import { ErrorState, LoadingState } from '@/components/ui/states';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatDate } from '@/lib/format';

export default function CertificatesScreen() {
  return (
    <RequireAuth reason="see your certificates" title="My certificates">
      <Certificates />
    </RequireAuth>
  );
}

/** Your certificates — the website's /certificates. */
function Certificates() {
  const theme = useTheme();
  const certificates = useQuery({ queryKey: keys.me.certificates, queryFn: api.certificates });

  return (
    <>
      <Stack.Screen options={{ title: 'My certificates' }} />
      <Screen refreshing={certificates.isRefetching} onRefresh={() => void certificates.refetch()}>
        {certificates.isPending ? (
          <LoadingState />
        ) : certificates.error ? (
          <ErrorState message={certificates.error.message} onRetry={() => void certificates.refetch()} />
        ) : certificates.data.length === 0 ? (
          <View style={[styles.empty, { borderColor: theme.border }]}>
            <Icon ios="rosette" android="workspace_premium" size={40} color={theme.primary} />
            <ThemedText type="smallBold">No certificates yet</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Finish a course to earn your first certificate.
            </ThemedText>
            <Button title="Browse courses" onPress={() => router.navigate('/browse')} />
          </View>
        ) : (
          certificates.data.map((certificate) => {
            const revoked = certificate.revokedAt != null;
            return (
              <Pressable
                key={certificate.id}
                accessibilityRole="button"
                onPress={() => router.push(`/certificates/${certificate.id}`)}
                style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
                <ThemedView style={[styles.card, { borderColor: revoked ? theme.danger : theme.border }]}>
                  <Icon
                    ios={revoked ? 'xmark.seal' : 'rosette'}
                    android={revoked ? 'cancel' : 'workspace_premium'}
                    size={32}
                    color={revoked ? theme.danger : '#b8860b'}
                  />
                  <View style={styles.flex}>
                    <ThemedText type="smallBold" style={styles.course}>
                      {certificate.courseTitleSnapshot}
                    </ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                      {certificate.instructorNameSnapshot} · {formatDate(certificate.issuedAt)}
                    </ThemedText>
                    {revoked ? (
                      <ThemedText type="small" style={{ color: theme.danger }}>
                        Revoked
                      </ThemedText>
                    ) : null}
                  </View>
                  <Icon ios="chevron.right" android="chevron_right" size={16} color={theme.textSecondary} />
                </ThemedView>
              </Pressable>
            );
          })
        )}
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  empty: { borderWidth: 1, borderStyle: 'dashed', borderRadius: 16, padding: Spacing.five, gap: Spacing.two, alignItems: 'center' },
  card: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, borderWidth: StyleSheet.hairlineWidth, borderRadius: 14, padding: Spacing.three },
  course: { fontSize: 16 },
  flex: { flex: 1, gap: 2 },
});
