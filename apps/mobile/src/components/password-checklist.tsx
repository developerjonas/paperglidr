import { checkPassword, type PasswordContext } from '@repo/password-policy';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const STRENGTH = ['Too weak', 'Too weak', 'Almost there', 'Strong', 'Very strong'] as const;

/** Live rules and strength meter — the same rules the server enforces (@repo/password-policy). */
export function PasswordChecklist({ password, context }: { password: string; context: PasswordContext }) {
  const theme = useTheme();
  const result = checkPassword(password, context);
  const barColor = result.score >= 3 ? theme.success : result.score === 2 ? '#f59e0b' : theme.danger;

  return (
    <View style={styles.wrap} accessibilityLiveRegion="polite">
      {password.length > 0 ? (
        <View style={styles.meterRow}>
          <View style={styles.meter}>
            {[1, 2, 3, 4].map((step) => (
              <View
                key={step}
                style={[styles.segment, { backgroundColor: result.score >= step ? barColor : theme.backgroundSelected }]}
              />
            ))}
          </View>
          <ThemedText type="small" themeColor="textSecondary">
            {STRENGTH[result.score]}
          </ThemedText>
        </View>
      ) : null}
      {result.checks.map((check) => (
        <ThemedText key={check.id} type="small" style={{ color: check.ok ? theme.success : theme.textSecondary }}>
          {check.ok ? '✓' : '○'} {check.label}
        </ThemedText>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: Spacing.one },
  meterRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, marginBottom: Spacing.one },
  meter: { flex: 1, flexDirection: 'row', gap: Spacing.one },
  segment: { flex: 1, height: 6, borderRadius: 3 },
});
