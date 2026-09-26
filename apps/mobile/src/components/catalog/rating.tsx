import { Platform, StyleSheet, Text, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Icon } from '@/components/ui/icon';
import { formatRating } from '@/lib/format';

const STAR = '#f59e0b';

/** "4.6 ★★★★½ (128)". Nothing when there are no reviews yet, like the website. */
export function Rating({
  average,
  count,
  size = 13,
  showCount = true,
}: {
  average: number | null;
  count: number;
  size?: number;
  showCount?: boolean;
}) {
  if (average == null || count === 0) return null;
  return (
    <View style={styles.row} accessibilityLabel={`Rated ${formatRating(average)} out of 5 from ${count} reviews`}>
      <ThemedText type="smallBold" style={{ color: '#b45309', fontSize: size + 1 }}>
        {formatRating(average)}
      </ThemedText>
      <Stars value={average} size={size} />
      {showCount ? (
        <ThemedText type="small" themeColor="textSecondary" style={{ fontSize: size }}>
          ({count})
        </ThemedText>
      ) : null}
    </View>
  );
}

export function Stars({ value, size = 13 }: { value: number; size?: number }) {
  return (
    <View style={styles.stars}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} fill={value >= i ? 'full' : value >= i - 0.5 ? 'half' : 'empty'} size={size} />
      ))}
    </View>
  );
}

// iOS: SF Symbols (filled variants exist). Android/web: Material Symbols
// only draw outlines, so filled stars are solid glyphs; a half star is a
// full one clipped over an empty one.
function Star({ fill, size }: { fill: 'full' | 'half' | 'empty'; size: number }) {
  if (Platform.OS === 'ios') {
    return fill === 'full' ? (
      <Icon ios="star.fill" android="star" size={size} color={STAR} />
    ) : fill === 'half' ? (
      <Icon ios="star.leadinghalf.filled" android="star_half" size={size} color={STAR} />
    ) : (
      <Icon ios="star" android="star_border" size={size} color={STAR} />
    );
  }
  const glyph = { fontSize: size, lineHeight: size + 2, color: STAR };
  return (
    <View style={{ width: size, height: size + 2 }}>
      <Text style={[glyph, styles.glyph]}>{fill === 'full' ? '\u2605' : '\u2606'}</Text>
      {fill === 'half' ? (
        <View style={[styles.halfClip, { width: size / 2 }]}>
          <Text style={[glyph, styles.glyph]}>{'\u2605'}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  stars: { flexDirection: 'row', gap: 1 },
  glyph: { includeFontPadding: false },
  halfClip: { position: 'absolute', left: 0, top: 0, overflow: 'hidden' },
});
