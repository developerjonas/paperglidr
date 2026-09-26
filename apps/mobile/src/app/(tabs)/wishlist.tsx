import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { keys } from '@/api/keys';
import type { WishlistItem } from '@/api/types';
import { api } from '@/api/v1';
import { ProductRow } from '@/components/catalog/product-card';
import { WishlistButton } from '@/components/catalog/wishlist-button';
import { RequireAuth } from '@/components/require-auth';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { ErrorState, LoadingState } from '@/components/ui/states';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useWishlist } from '@/hooks/use-wishlist';
import { formatPlural } from '@/lib/format';

export default function WishlistScreen() {
  return (
    <RequireAuth reason="see your wishlist">
      <Wishlist />
    </RequireAuth>
  );
}

/** The website's "My Wishlist": saved products, newest first. */
function Wishlist() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const wishlist = useQuery({ queryKey: keys.me.wishlist, queryFn: api.wishlist });
  const items = wishlist.data ?? [];

  return (
    <ThemedView style={styles.fill}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.productId}
        renderItem={({ item }) =>
          item.available === false ? (
            <UnavailableRow item={item} />
          ) : (
            <ProductRow
              product={{ ...item, id: item.productId }}
              trailing={<WishlistButton productId={item.productId} variant="outline" size={38} />}
            />
          )
        }
        contentContainerStyle={[styles.list, { paddingTop: insets.top + Spacing.three }]}
        refreshControl={
          <RefreshControl refreshing={wishlist.isRefetching} onRefresh={() => void wishlist.refetch()} tintColor={theme.primary} />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <ThemedText type="subtitle">My Wishlist</ThemedText>
            {items.length > 0 ? (
              <ThemedText type="small" themeColor="textSecondary">
                {formatPlural(items.length, 'saved course', 'saved courses')}
              </ThemedText>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          wishlist.isPending ? (
            <LoadingState />
          ) : wishlist.error ? (
            <ErrorState message={wishlist.error.message} onRetry={() => void wishlist.refetch()} />
          ) : (
            <View style={[styles.empty, { borderColor: theme.border }]}>
              <ThemedText themeColor="textSecondary">You haven&apos;t saved any courses yet.</ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={styles.center}>
                Tap the heart on any course to save it for later.
              </ThemedText>
              <Button title="Browse courses" onPress={() => router.navigate('/browse')} />
            </View>
          )
        }
      />
    </ThemedView>
  );
}

/** A saved product that was unpublished: shown so it can be removed, not opened. */
function UnavailableRow({ item }: { item: WishlistItem }) {
  const theme = useTheme();
  const { toggle, pending } = useWishlist(item.productId);
  return (
    <View style={[styles.row, { borderColor: theme.border }]}>
      <Image source={item.imageUrl} style={[styles.thumb, { backgroundColor: theme.backgroundSelected, opacity: 0.4 }]} />
      <View style={styles.flex}>
        <ThemedText type="smallBold" themeColor="textSecondary" numberOfLines={2}>
          {item.name}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          No longer available
        </ThemedText>
      </View>
      <Button title="Remove" variant="outline" style={styles.remove} loading={pending} onPress={toggle} />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  flex: { flex: 1, gap: 2 },
  list: { paddingHorizontal: Spacing.four, paddingBottom: Spacing.six, width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center' },
  header: { gap: Spacing.one, marginBottom: Spacing.one },
  empty: { borderWidth: 1, borderStyle: 'dashed', borderRadius: 16, padding: Spacing.five, gap: Spacing.three, alignItems: 'center', marginTop: Spacing.three },
  center: { textAlign: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, paddingVertical: Spacing.three, borderBottomWidth: StyleSheet.hairlineWidth },
  thumb: { width: 120, aspectRatio: 16 / 9, borderRadius: 10 },
  remove: { minHeight: 36, paddingHorizontal: Spacing.three },
});
