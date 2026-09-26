import { FlatList, Pressable, StyleSheet, View } from 'react-native';

import { ProductCard, type ProductCardData } from '@/components/catalog/product-card';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const CARD_WIDTH = 250;

/** A titled, horizontally scrolling row of product cards, with an optional "See all". */
export function ProductCarousel({
  title,
  products,
  onSeeAll,
}: {
  title: string;
  products: ProductCardData[];
  onSeeAll?: () => void;
}) {
  const theme = useTheme();
  if (products.length === 0) return null;
  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <ThemedText type="smallBold" style={styles.title}>
          {title}
        </ThemedText>
        {onSeeAll ? (
          <Pressable onPress={onSeeAll} hitSlop={8}>
            <ThemedText type="smallBold" style={{ color: theme.primary }}>
              See all
            </ThemedText>
          </Pressable>
        ) : null}
      </View>
      <FlatList
        horizontal
        data={products}
        keyExtractor={(item) => item.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => <ProductCard product={item} width={CARD_WIDTH} />}
        snapToInterval={CARD_WIDTH + Spacing.three}
        decelerationRate="fast"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: Spacing.three },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 20, lineHeight: 26 },
  list: { gap: Spacing.three, paddingRight: Spacing.four },
});
