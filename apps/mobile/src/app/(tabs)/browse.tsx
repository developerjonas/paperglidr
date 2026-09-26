import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { keys } from '@/api/keys';
import type { SearchParams, SearchSort } from '@/api/types';
import { api } from '@/api/v1';
import { CategoryChips, Chip } from '@/components/catalog/category-chips';
import { ProductRow } from '@/components/catalog/product-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Icon } from '@/components/ui/icon';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/states';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const PAGE_SIZE = 20; // the search API's page size
const SORTS: { value: SearchSort; label: string }[] = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'rating', label: 'Highest rated' },
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price: low to high' },
  { value: 'price_desc', label: 'Price: high to low' },
];

/** Search the catalogue — the website's /browse, with sorting and endless scroll. */
export default function BrowseScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ categoryId?: string; sort?: string }>();

  const [text, setText] = useState('');
  const [q, setQ] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(params.categoryId ?? null);
  const [sort, setSort] = useState<SearchSort>(
    SORTS.some((s) => s.value === params.sort) ? (params.sort as SearchSort) : 'relevance',
  );

  // Arriving from Home with a category or sort: apply it (adjusting state
  // during render when the params change — React's pattern, not an effect).
  const [seen, setSeen] = useState({ categoryId: params.categoryId, sort: params.sort });
  if (seen.categoryId !== params.categoryId || seen.sort !== params.sort) {
    setSeen({ categoryId: params.categoryId, sort: params.sort });
    if (params.categoryId !== seen.categoryId && params.categoryId !== undefined) {
      setCategoryId(params.categoryId || null);
    }
    if (params.sort !== seen.sort && SORTS.some((s) => s.value === params.sort)) {
      setSort(params.sort as SearchSort);
    }
  }

  // Search after typing pauses, as on the website.
  useEffect(() => {
    const timer = setTimeout(() => setQ(text.trim()), 350);
    return () => clearTimeout(timer);
  }, [text]);

  const categories = useQuery({ queryKey: keys.categories, queryFn: api.categories });
  const base: SearchParams = { q: q || undefined, categoryId: categoryId ?? undefined, sort };
  const results = useInfiniteQuery({
    queryKey: keys.search(base),
    queryFn: ({ pageParam }) => api.search({ ...base, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.results.length === PAGE_SIZE ? last.page + 1 : undefined),
  });
  const items = results.data?.pages.flatMap((page) => page.results) ?? [];
  const categoryName = categories.data?.find((c) => c.id === categoryId)?.name;

  const header = (
    <View style={styles.header}>
      <ThemedText type="subtitle">Browse</ThemedText>
      <View style={[styles.searchBox, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
        <Icon ios="magnifyingglass" android="search" size={18} color={theme.textSecondary} />
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Search courses by title or topic"
          placeholderTextColor={theme.textSecondary}
          returnKeyType="search"
          onSubmitEditing={() => setQ(text.trim())}
          autoCorrect={false}
          accessibilityLabel="Search courses"
          style={[styles.searchInput, { color: theme.text }]}
        />
        {text ? (
          <Pressable accessibilityLabel="Clear search" hitSlop={8} onPress={() => setText('')}>
            <Icon ios="xmark.circle.fill" android="cancel" size={18} color={theme.textSecondary} />
          </Pressable>
        ) : null}
      </View>
      {categories.data && categories.data.length > 0 ? (
        <CategoryChips categories={categories.data} selected={categoryId} onSelect={setCategoryId} />
      ) : null}
      <FlatList
        horizontal
        data={SORTS}
        keyExtractor={(s) => s.value}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.sorts}
        renderItem={({ item }) => <Chip label={item.label} active={item.value === sort} onPress={() => setSort(item.value)} />}
      />
      <ThemedText type="smallBold" style={styles.resultsTitle}>
        {q ? `Results for “${q}”` : categoryName ?? 'All courses'}
      </ThemedText>
    </View>
  );

  return (
    <ThemedView style={styles.fill}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ProductRow product={item} />}
        ListHeaderComponent={header}
        ListEmptyComponent={
          results.isPending ? (
            <LoadingState />
          ) : results.error ? (
            <ErrorState message={results.error.message} onRetry={() => void results.refetch()} />
          ) : (
            <EmptyState
              title={q ? `No courses found for “${q}”` : 'No courses here yet'}
              message={q ? 'Try a different keyword or browse all courses.' : 'Check back soon — instructors are preparing new content.'}
            />
          )
        }
        ListFooterComponent={results.isFetchingNextPage ? <ActivityIndicator color={theme.primary} style={styles.more} /> : null}
        onEndReached={() => {
          if (results.hasNextPage && !results.isFetchingNextPage) void results.fetchNextPage();
        }}
        onEndReachedThreshold={0.5}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={[styles.list, { paddingTop: insets.top + Spacing.three }]}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  list: { paddingHorizontal: Spacing.four, paddingBottom: Spacing.six, width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center' },
  header: { gap: Spacing.three, marginBottom: Spacing.one },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 999,
    paddingHorizontal: Spacing.three,
    height: 48,
  },
  searchInput: { flex: 1, fontSize: 16, height: '100%' },
  sorts: { gap: Spacing.two },
  resultsTitle: { fontSize: 18, marginTop: Spacing.two },
  more: { marginVertical: Spacing.four },
});
