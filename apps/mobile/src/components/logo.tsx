import { BRAND_NAME, PLANE_MARK, WORDMARK } from '@repo/brand';
import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';

/**
 * Paper-plane mark + wordmark, from @repo/brand: the same mark as the
 * website's logo, the app icon and the splash screen.
 */
export function Logo({ size = 24 }: { size?: number }) {
  const theme = useTheme();
  return (
    <View style={styles.row} accessible accessibilityRole="header" accessibilityLabel={BRAND_NAME}>
      <Svg width={size} height={size} viewBox={PLANE_MARK.viewBox} fill="none">
        {PLANE_MARK.paths.map((d) => (
          <Path
            key={d}
            d={d}
            stroke={theme.primary}
            strokeWidth={PLANE_MARK.strokeWidth}
            strokeLinejoin={PLANE_MARK.strokeLinejoin}
            strokeLinecap={PLANE_MARK.strokeLinecap}
          />
        ))}
      </Svg>
      <ThemedText
        style={{
          color: theme.primary,
          fontSize: size * 0.8,
          lineHeight: size,
          fontWeight: String(WORDMARK.fontWeight) as '700',
          fontStyle: WORDMARK.fontStyle,
          letterSpacing: size * 0.8 * WORDMARK.letterSpacingEm,
        }}>
        {BRAND_NAME}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
