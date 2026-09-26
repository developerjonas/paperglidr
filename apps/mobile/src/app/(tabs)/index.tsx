import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { keys } from '@/api/keys';
import { api } from '@/api/v1';
import { useAuth } from '@/auth/auth-context';
import { CategoryChips } from '@/components/catalog/category-chips';
import { ProductCarousel } from '@/components/catalog/product-carousel';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Icon } from '@/components/ui/icon';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/states';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// Home: the website's featured list (first 8 public products, A–Z) plus
// highly rated and newest rows from search, and categories to jump into.
export default function HomeScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { status, user } = useAuth();

  const categories = useQuery({ queryKey: keys.categories, queryFn: api.categories });
  const featured = useQuery({ queryKey: keys.products(8), queryFn: () => api.products(8) });
  // Rated 4+ only: sorting by rating alone would put unrated products first.
  const topRatedParams = { sort: 'rating' as const, minRating: 4 };
  const topRated = useQuery({ queryKey: keys.search(topRatedParams), queryFn: () => api.search(topRatedParams) });
  const newestParams = { sort: 'newest' as const };
  const newest = useQuery({ queryKey: keys.search(newestParams), queryFn: () => api.search(newestParams) });

  const refreshing = featured.isRefetching || topRated.isRefetching || newest.isRefetching;
  const firstName = status === 'signedIn' ? user?.name.split(/\s+/)[0] : undefined;

  function refresh() {
    void categories.refetch();
    void featured.refetch();
    void topRated.refetch();
    void newest.refetch();
  }

  return (
    <ThemedView style={styles.fill}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + Spacing.three }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={theme.primary} />}>
        <View style={styles.column}>
          <View style={styles.greeting}>
            <ThemedText type="subtitle" style={styles.hello}>
              {firstName ? `Hi, ${firstName}` : 'Learn something new'}
            </ThemedText>
            <ThemedText themeColor="textSecondary">Courses from Nepali instructors, priced in rupees.</ThemedText>
          </View>

          <Pressable
            accessibilityRole="search"
            accessibilityLabel="Search courses"
            onPress={() => router.navigate('/browse')}
            style={({ pressed }) => [
              styles.search,
              { backgroundColor: theme.backgroundElement, borderColor: theme.border, opacity: pressed ? 0.8 : 1 },
            ]}>
            <Icon ios="magnifyingglass" android="search" size={18} color={theme.textSecondary} />
            <ThemedText themeColor="textSecondary">Search courses</ThemedText>
          </Pressable>

          {categories.data && categories.data.length > 0 ? (
            <CategoryChips
              categories={categories.data}
              selected={null}
              includeAll={false}
              onSelect={(categoryId) =>
                router.navigate({ pathname: '/browse', params: categoryId ? { categoryId } : {} })
              }
            />
          ) : null}

          {featured.isPending ? (
            <LoadingState />
          ) : featured.error ? (
            <ErrorState message={featured.error.message} onRetry={refresh} />
          ) : featured.data.length === 0 ? (
            <EmptyState
              title="No courses published yet"
              message="Check back soon — instructors are preparing new content."
            />
          ) : (
            <>
              <ProductCarousel
                title="Featured courses"
                products={featured.data}
                onSeeAll={() => router.navigate('/browse')}
              />
              <ProductCarousel
                title="Highly rated"
                products={topRated.data?.results ?? []}
                onSeeAll={() => router.navigate({ pathname: '/browse', params: { sort: 'rating' } })}
              />
              <ProductCarousel
                title="New on Chiyali"
                products={newest.data?.results ?? []}
                onSeeAll={() => router.navigate({ pathname: '/browse', params: { sort: 'newest' } })}
              />
            </>
          )}
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: { paddingHorizontal: Spacing.four, paddingBottom: Spacing.six, alignItems: 'center' },
  column: { width: '100%', maxWidth: MaxContentWidth, gap: Spacing.four },
  greeting: { gap: Spacing.one },
  hello: { fontSize: 28, lineHeight: 34 },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 999,
    paddingHorizontal: Spacing.three,
    height: 48,
  },
});
