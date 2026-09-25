import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** Pill button, as on the website: primary (blue) or outline. */
export function Button({
  title,
  variant = 'primary',
  loading = false,
  disabled,
  style,
  ...props
}: Omit<PressableProps, 'children' | 'style'> & {
  title: string;
  variant?: 'primary' | 'outline';
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useTheme();
  const isDisabled = disabled || loading;
  const primary = variant === 'primary';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        primary
          ? { backgroundColor: theme.primary }
          : { borderWidth: 1, borderColor: theme.border, backgroundColor: theme.background },
        { opacity: isDisabled ? 0.5 : pressed ? 0.8 : 1 },
        style,
      ]}
      {...props}>
      {loading ? <ActivityIndicator color={primary ? theme.onPrimary : theme.text} /> : null}
      <ThemedText type="smallBold" style={{ fontSize: 16, color: primary ? theme.onPrimary : theme.text }}>
        {title}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 50,
    borderRadius: 999,
    paddingHorizontal: Spacing.four,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
});
