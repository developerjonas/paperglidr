import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { keys } from '@/api/keys';
import type { TicketCategory } from '@/api/types';
import { api } from '@/api/v1';
import { Chip } from '@/components/catalog/category-chips';
import { RequireAuth } from '@/components/require-auth';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { FormMessage } from '@/components/ui/form-message';
import { Screen } from '@/components/ui/screen';
import { TextField } from '@/components/ui/text-field';
import { Spacing } from '@/constants/theme';
import { CATEGORY_LABELS } from '@/lib/support';

export default function NewTicketScreen() {
  return (
    <RequireAuth reason="contact support" title="New ticket">
      <NewTicket />
    </RequireAuth>
  );
}

// The server's rules (newTicketSchema): subject 3–150, message 10–5000.
function NewTicket() {
  const queryClient = useQueryClient();
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState<TicketCategory>('other');
  const [message, setMessage] = useState('');
  const create = useMutation({
    mutationFn: () => api.createSupportTicket({ subject: subject.trim(), category, message: message.trim() }),
    onSuccess: (ticket) => {
      void queryClient.invalidateQueries({ queryKey: keys.me.supportTickets });
      router.replace(`/support/${ticket.id}`);
    },
  });
  const valid = subject.trim().length >= 3 && message.trim().length >= 10;

  return (
    <>
      <Stack.Screen options={{ title: 'New ticket' }} />
      <Screen>
        <ThemedText type="subtitle">Describe your issue</ThemedText>
        <TextField
          label="Subject"
          value={subject}
          onChangeText={setSubject}
          placeholder="Briefly describe the issue"
          maxLength={150}
        />
        <View style={styles.categories}>
          <ThemedText type="smallBold">Category</ThemedText>
          <View style={styles.chips}>
            {(Object.keys(CATEGORY_LABELS) as TicketCategory[]).map((value) => (
              <Chip key={value} label={CATEGORY_LABELS[value]} active={category === value} onPress={() => setCategory(value)} />
            ))}
          </View>
        </View>
        <TextField
          label="Message"
          value={message}
          onChangeText={setMessage}
          placeholder="What's going on? Include as much detail as you can."
          multiline
          maxLength={5000}
          style={styles.message}
          hint="At least 10 characters."
        />
        <FormMessage message={create.error ? create.error.message : null} />
        <Button title="Submit ticket" onPress={() => create.mutate()} loading={create.isPending} disabled={!valid} />
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  categories: { gap: Spacing.two },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  message: { minHeight: 140, textAlignVertical: 'top' },
});
