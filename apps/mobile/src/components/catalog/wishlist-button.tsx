import { Platform, Pressable, StyleSheet, Text } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { useWishlist } from '@/hooks/use-wishlist';
import { useTheme } from '@/hooks/use-theme';

const RED = '#ef4444';

/** Heart toggle: floating on a card image, or outlined next to a price. */
export function WishlistButton({
  productId,
  variant = 'floating',
  size = 36,
}: {
  productId: string;
  variant?: 'floating' | 'outline';
  size?: number;
}) {
  const theme = useTheme();
  const { saved, toggle, pending } = useWishlist(productId);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={saved ? 'Remove from wishlist' : 'Add to wishlist'}
      accessibilityState={{ selected: saved, busy: pending }}
      hitSlop={6}
      onPress={toggle}
      style={({ pressed }) => [
        styles.base,
        { width: size, height: size, borderRadius: size / 2, opacity: pressed ? 0.7 : 1 },
        variant === 'floating'
          ? { backgroundColor: 'rgba(255,255,255,0.92)' }
          : { borderWidth: 1, borderColor: theme.border, backgroundColor: theme.background },
      ]}>
      {saved ? (
        Platform.OS === 'ios' ? (
          <Icon ios="heart.fill" android="favorite" size={size * 0.5} color={RED} />
        ) : (
          // Material Symbols only draw an outline: a solid glyph reads as "saved".
          <Text style={{ color: RED, fontSize: size * 0.5, lineHeight: size * 0.6, includeFontPadding: false }}>
            {'\u2665\uFE0E'}
          </Text>
        )
      ) : (
        <Icon
          ios="heart"
          android="favorite_border"
          size={size * 0.5}
          color={variant === 'floating' ? '#23232a' : theme.text}
        />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center' },
});
