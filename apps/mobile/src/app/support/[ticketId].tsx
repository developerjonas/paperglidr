import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { keys } from '@/api/keys';
import { api } from '@/api/v1';
import { RequireAuth } from '@/components/require-auth';
import { StatusBadge } from '@/components/support/status-badge';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { FormMessage } from '@/components/ui/form-message';
import { Screen } from '@/components/ui/screen';
import { ErrorState, LoadingState } from '@/components/ui/states';
import { TextField } from '@/components/ui/text-field';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatDate } from '@/lib/format';
import { CATEGORY_LABELS } from '@/lib/support';

export default function TicketScreen() {
  return (
    <RequireAuth reason="see this ticket" title="Ticket">
      <Ticket />
    </RequireAuth>
  );
}

/** One ticket: the conversation (Support Team replies marked Staff) and a reply box. */
function Ticket() {
  const { ticketId } = useLocalSearchParams<{ ticketId: string }>();
  const theme = useTheme();
  const queryClient = useQueryClient();
  const ticket = useQuery({ queryKey: keys.me.supportTicket(ticketId), queryFn: () => api.supportTicket(ticketId) });
  const [reply, setReply] = useState('');
  const send = useMutation({
    mutationFn: () => api.replyToSupportTicket(ticketId, reply.trim()),
    onSuccess: (updated) => {
      setReply('');
      queryClient.setQueryData(keys.me.supportTicket(ticketId), updated);
      void queryClient.invalidateQueries({ queryKey: keys.me.supportTickets });
    },
  });

  if (ticket.isPending) return <><Stack.Screen options={{ title: 'Ticket' }} /><LoadingState /></>;
  if (ticket.error) {
    return (
      <>
        <Stack.Screen options={{ title: 'Ticket' }} />
        <ErrorState message={ticket.error.message} onRetry={() => void ticket.refetch()} />
      </>
    );
  }
  const t = ticket.data;

  return (
    <>
      <Stack.Screen options={{ title: 'Ticket' }} />
      <Screen refreshing={ticket.isRefetching} onRefresh={() => void ticket.refetch()}>
        <View style={styles.header}>
          <ThemedText type="subtitle" style={styles.subject}>
            {t.subject}
          </ThemedText>
          <View style={styles.row}>
            <StatusBadge status={t.status} />
            <ThemedText type="small" themeColor="textSecondary">
              {CATEGORY_LABELS[t.category]}
            </ThemedText>
          </View>
        </View>

        {t.messages.map((message) => (
          <ThemedView
            key={message.id}
            type={message.isAdminReply ? 'backgroundElement' : 'background'}
            style={[
              styles.message,
              { borderColor: message.isAdminReply ? theme.primary : theme.border },
              message.isAdminReply ? styles.fromStaff : styles.fromYou,
            ]}>
            <View style={styles.row}>
              <ThemedText type="smallBold">{message.isAdminReply ? 'Support Team' : 'You'}</ThemedText>
              {message.isAdminReply ? (
                <View style={[styles.staff, { backgroundColor: theme.backgroundSelected }]}>
                  <ThemedText type="small" style={styles.staffText}>
                    Staff
                  </ThemedText>
                </View>
              ) : null}
              <ThemedText type="small" themeColor="textSecondary">
                {formatDate(message.createdAt)}
              </ThemedText>
            </View>
            <ThemedText>{message.content}</ThemedText>
          </ThemedView>
        ))}

        {t.status === 'closed' ? (
          <ThemedText type="small" themeColor="textSecondary">
            This ticket is closed.
          </ThemedText>
        ) : (
          <View style={styles.replyBox}>
            <TextField
              label="Reply"
              value={reply}
              onChangeText={setReply}
              placeholder="Add a reply..."
              multiline
              maxLength={5000}
              style={styles.replyInput}
            />
            <FormMessage message={send.error ? send.error.message : null} />
            <Button
              title={send.isPending ? 'Sending...' : 'Send'}
              onPress={() => send.mutate()}
              loading={send.isPending}
              disabled={reply.trim().length === 0}
            />
          </View>
        )}
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  header: { gap: Spacing.two },
  subject: { fontSize: 24, lineHeight: 30 },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, flexWrap: 'wrap' },
  message: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 14, padding: Spacing.three, gap: Spacing.two },
  fromStaff: { marginLeft: Spacing.four },
  fromYou: { marginRight: Spacing.four },
  staff: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 1 },
  staffText: { fontSize: 11, fontWeight: '600' },
  replyBox: { gap: Spacing.two },
  replyInput: { minHeight: 90, textAlignVertical: 'top' },
});
