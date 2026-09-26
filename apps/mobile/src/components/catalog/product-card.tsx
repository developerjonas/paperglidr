import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Rating } from '@/components/catalog/rating';
import { WishlistButton } from '@/components/catalog/wishlist-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatPrice } from '@/lib/format';

/** What every product card needs — a subset of the v1 listing, search and wishlist shapes. */
export type ProductCardData = {
  id: string;
  name: string;
  imageUrl: string;
  priceInRupees: number;
  description?: string;
  avgRating?: number | null;
  reviewCount?: number;
};

function open(productId: string) {
  router.push(`/products/${productId}`);
}

/**
 * Vertical card for carousels and grids: 16:9 image with the wishlist
 * heart, title, rating and price. A product is what you buy; the courses
 * inside it are what you study.
 */
export function ProductCard({ product, width }: { product: ProductCardData; width?: number }) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${product.name}, ${formatPrice(product.priceInRupees)}`}
      onPress={() => open(product.id)}
      style={({ pressed }) => [{ width, opacity: pressed ? 0.85 : 1 }]}>
      <ThemedView style={[styles.card, { borderColor: theme.border }]}>
        <View>
          <Image
            source={product.imageUrl}
            style={[styles.image, { backgroundColor: theme.backgroundSelected }]}
            contentFit="cover"
            transition={150}
            accessibilityIgnoresInvertColors
          />
          <View style={styles.heart}>
            <WishlistButton productId={product.id} size={34} />
          </View>
        </View>
        <View style={styles.body}>
          <ThemedText type="smallBold" numberOfLines={2} style={styles.title}>
            {product.name}
          </ThemedText>
          <Rating average={product.avgRating ?? null} count={product.reviewCount ?? 0} />
          <ThemedText type="smallBold" style={styles.price}>
            {formatPrice(product.priceInRupees)}
          </ThemedText>
        </View>
      </ThemedView>
    </Pressable>
  );
}

/** Horizontal row for search results and lists: thumbnail, title, rating, price. */
export function ProductRow({ product, trailing }: { product: ProductCardData; trailing?: React.ReactNode }) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${product.name}, ${formatPrice(product.priceInRupees)}`}
      onPress={() => open(product.id)}
      style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
      <View style={[styles.row, { borderColor: theme.border }]}>
        <Image
          source={product.imageUrl}
          style={[styles.thumb, { backgroundColor: theme.backgroundSelected }]}
          contentFit="cover"
          transition={150}
        />
        <View style={styles.rowBody}>
          <ThemedText type="smallBold" numberOfLines={2} style={styles.title}>
            {product.name}
          </ThemedText>
          {product.description ? (
            <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
              {product.description}
            </ThemedText>
          ) : null}
          <Rating average={product.avgRating ?? null} count={product.reviewCount ?? 0} size={12} />
          <ThemedText type="smallBold">{formatPrice(product.priceInRupees)}</ThemedText>
        </View>
        {trailing}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  image: { width: '100%', aspectRatio: 16 / 9 },
  heart: { position: 'absolute', top: Spacing.two, right: Spacing.two },
  body: { padding: Spacing.three, gap: Spacing.one },
  title: { fontSize: 15, lineHeight: 20 },
  price: { fontSize: 16, marginTop: Spacing.half },
  row: {
    flexDirection: 'row',
    gap: Spacing.three,
    paddingVertical: Spacing.three,
    borderBottomWidth: StyleSheet.hairlineWidth,
    alignItems: 'flex-start',
  },
  thumb: { width: 120, aspectRatio: 16 / 9, borderRadius: 10 },
  rowBody: { flex: 1, gap: 3 },
});
