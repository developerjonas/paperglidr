import { useMutation } from '@tanstack/react-query';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import type { ReportReason } from '@/api/types';
import { api } from '@/api/v1';
import { Chip } from '@/components/catalog/category-chips';
import { RequireAuth } from '@/components/require-auth';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { FormMessage } from '@/components/ui/form-message';
import { Screen } from '@/components/ui/screen';
import { TextField } from '@/components/ui/text-field';
import { Spacing } from '@/constants/theme';

// The website's ReportButton wording.
const REASONS: { value: ReportReason; label: string }[] = [
  { value: 'scam', label: 'Scam / not as described' },
  { value: 'piracy', label: 'Pirated / stolen content' },
  { value: 'misleading', label: 'Misleading claims' },
  { value: 'inappropriate', label: 'Inappropriate content' },
  { value: 'other', label: 'Other' },
];

/** Report a product ("course") or a lesson to the admins. Opened as a modal. */
export default function ReportScreen() {
  const { targetType, targetId } = useLocalSearchParams<{ targetType: 'product' | 'lesson'; targetId: string }>();
  const noun = targetType === 'lesson' ? 'lesson' : 'course';
  return (
    <RequireAuth reason={`report this ${noun}`} title={`Report ${noun}`}>
      <ReportForm targetType={targetType === 'lesson' ? 'lesson' : 'product'} targetId={targetId} noun={noun} />
    </RequireAuth>
  );
}

function ReportForm({ targetType, targetId, noun }: { targetType: 'product' | 'lesson'; targetId: string; noun: string }) {
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [details, setDetails] = useState('');
  const report = useMutation({
    mutationFn: () => api.report({ targetType, targetId, reason: reason!, details: details.trim() || undefined }),
  });

  return (
    <>
      <Stack.Screen options={{ title: `Report ${noun}` }} />
      <Screen>
        {report.isSuccess ? (
          <>
            <FormMessage tone="success" message={report.data.message ?? "Thanks — we'll take a look at this."} />
            <Button title="Done" onPress={() => router.back()} />
          </>
        ) : (
          <>
            <ThemedText type="subtitle">Report this {noun}</ThemedText>
            <ThemedText themeColor="textSecondary">Why are you reporting this {noun}?</ThemedText>
            <View style={styles.reasons}>
              {REASONS.map((r) => (
                <Chip key={r.value} label={r.label} active={reason === r.value} onPress={() => setReason(r.value)} />
              ))}
            </View>
            <TextField
              label="Details (optional)"
              value={details}
              onChangeText={setDetails}
              placeholder="Any additional details"
              multiline
              maxLength={2000}
              style={styles.details}
            />
            <FormMessage message={report.error ? report.error.message : null} />
            <Button
              title="Send report"
              onPress={() => report.mutate()}
              loading={report.isPending}
              disabled={reason == null}
            />
          </>
        )}
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  reasons: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  details: { minHeight: 100, textAlignVertical: 'top' },
});
