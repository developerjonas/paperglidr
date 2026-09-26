import { useQuery } from '@tanstack/react-query';
import { router, Stack } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { keys } from '@/api/keys';
import { api } from '@/api/v1';
import { RequireAuth } from '@/components/require-auth';
import { StatusBadge } from '@/components/support/status-badge';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/states';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatDate } from '@/lib/format';
import { CATEGORY_LABELS } from '@/lib/support';

export default function SupportScreen() {
  return (
    <RequireAuth reason="see your support tickets" title="Support">
      <Tickets />
    </RequireAuth>
  );
}

/** Your tickets, most recently active first — the website's /support. */
function Tickets() {
  const theme = useTheme();
  const tickets = useQuery({ queryKey: keys.me.supportTickets, queryFn: api.supportTickets });

  return (
    <>
      <Stack.Screen options={{ title: 'Support' }} />
      <Screen refreshing={tickets.isRefetching} onRefresh={() => void tickets.refetch()}>
        <Button title="New Ticket" onPress={() => router.push('/support/new')} />
        {tickets.isPending ? (
          <LoadingState />
        ) : tickets.error ? (
          <ErrorState message={tickets.error.message} onRetry={() => void tickets.refetch()} />
        ) : tickets.data.length === 0 ? (
          <EmptyState
            title="No support tickets yet"
            message="Something wrong, or a question about your account or a purchase? Start a ticket and we'll get back to you."
          />
        ) : (
          tickets.data.map((ticket) => (
            <Pressable
              key={ticket.id}
              accessibilityRole="button"
              onPress={() => router.push(`/support/${ticket.id}`)}
              style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
              <ThemedView style={[styles.ticket, { borderColor: theme.border }]}>
                <View style={styles.row}>
                  <ThemedText type="smallBold" style={styles.subject} numberOfLines={2}>
                    {ticket.subject}
                  </ThemedText>
                  <StatusBadge status={ticket.status} />
                </View>
                <ThemedText type="small" themeColor="textSecondary">
                  {CATEGORY_LABELS[ticket.category]} · Last activity {formatDate(ticket.lastMessageAt)}
                </ThemedText>
              </ThemedView>
            </Pressable>
          ))
        )}
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  ticket: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 14, padding: Spacing.three, gap: Spacing.one },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.two },
  subject: { flex: 1, fontSize: 16 },
});
