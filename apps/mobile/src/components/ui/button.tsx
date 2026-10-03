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

/** Pill button, as on the website: primary (blue), outline, or danger (red, for actions that can't be undone). */
export function Button({
  title,
  variant = 'primary',
  loading = false,
  disabled,
  style,
  ...props
}: Omit<PressableProps, 'children' | 'style'> & {
  title: string;
  variant?: 'primary' | 'outline' | 'danger';
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useTheme();
  const isDisabled = disabled || loading;
  const filled = variant !== 'outline';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        filled
          ? { backgroundColor: variant === 'danger' ? theme.danger : theme.primary }
          : { borderWidth: 1, borderColor: theme.border, backgroundColor: theme.background },
        { opacity: isDisabled ? 0.5 : pressed ? 0.8 : 1 },
        style,
      ]}
      {...props}>
      {loading ? <ActivityIndicator color={filled ? theme.onPrimary : theme.text} /> : null}
      <ThemedText type="smallBold" style={{ fontSize: 16, color: filled ? theme.onPrimary : theme.text }}>
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
