import { forwardRef, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** Labelled input. `secure` adds a show/hide toggle. */
export const TextField = forwardRef<
  TextInput,
  TextInputProps & { label: string; hint?: ReactNode; error?: string | null; secure?: boolean }
>(function TextField({ label, hint, error, secure = false, style, ...props }, ref) {
  const theme = useTheme();
  const [visible, setVisible] = useState(false);

  return (
    <View style={styles.wrap}>
      <ThemedText type="smallBold">{label}</ThemedText>
      <View style={[styles.box, { borderColor: error ? theme.danger : theme.border, backgroundColor: theme.background }]}>
        <TextInput
          ref={ref}
          accessibilityLabel={label}
          placeholderTextColor={theme.textSecondary}
          secureTextEntry={secure && !visible}
          style={[styles.input, { color: theme.text }, style]}
          {...props}
        />
        {secure ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={visible ? 'Hide password' : 'Show password'}
            onPress={() => setVisible((v) => !v)}
            hitSlop={8}
            style={styles.toggle}>
            <ThemedText type="small" style={{ color: theme.primary }}>
              {visible ? 'Hide' : 'Show'}
            </ThemedText>
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <ThemedText type="small" style={{ color: theme.danger }}>
          {error}
        </ThemedText>
      ) : hint ? (
        typeof hint === 'string' ? (
          <ThemedText type="small" themeColor="textSecondary">
            {hint}
          </ThemedText>
        ) : (
          hint
        )
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: { gap: Spacing.two },
  box: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 14, minHeight: 50 },
  input: { flex: 1, fontSize: 16, paddingHorizontal: Spacing.three, paddingVertical: Spacing.three },
  toggle: { paddingHorizontal: Spacing.three },
});
