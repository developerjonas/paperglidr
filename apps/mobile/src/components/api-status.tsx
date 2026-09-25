import { useQuery } from '@tanstack/react-query';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { API_URL } from '@/api/config';
import { keys } from '@/api/keys';
import { api } from '@/api/v1';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/**
 * Step 2's proof of connection: calls three public v1 endpoints and shows
 * what came back (or why it failed). Replaced by the real Home in step 5.
 */
export function ApiStatus() {
  const theme = useTheme();
  const config = useQuery({ queryKey: keys.config, queryFn: api.config });
  const categories = useQuery({ queryKey: keys.categories, queryFn: api.categories });
  const products = useQuery({ queryKey: keys.products(), queryFn: () => api.products() });

  const loading = config.isPending || categories.isPending || products.isPending;
  const error = config.error ?? categories.error ?? products.error;

  function retry() {
    void config.refetch();
    void categories.refetch();
    void products.refetch();
  }

  return (
    <ThemedView type="backgroundElement" style={[styles.card, { borderColor: theme.border }]}>
      <ThemedText type="smallBold">API connection</ThemedText>
      <ThemedText type="code" themeColor="textSecondary">
        {API_URL}
      </ThemedText>

      {loading ? (
        <View style={styles.row}>
          <ActivityIndicator color={theme.primary} />
          <ThemedText type="small" themeColor="textSecondary">
            Connecting…
          </ThemedText>
        </View>
      ) : error ? (
        <View style={styles.block}>
          <ThemedText type="small" style={{ color: theme.danger }}>
            Not connected: {error.message}
          </ThemedText>
          <Pressable onPress={retry} style={[styles.button, { backgroundColor: theme.primary }]}>
            <ThemedText type="smallBold" style={{ color: theme.onPrimary }}>
              Retry
            </ThemedText>
          </Pressable>
        </View>
      ) : (
        <View style={styles.block}>
          <ThemedText type="small" style={{ color: theme.success }}>
            ● Connected to {config.data?.siteName}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {categories.data?.length ?? 0} categories · {products.data?.length ?? 0} products ·
            payments: {config.data?.gateways.join(', ') || 'none'}
          </ThemedText>
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 14, padding: Spacing.three, gap: Spacing.two, marginTop: Spacing.three },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  block: { gap: Spacing.two },
  button: { alignSelf: 'flex-start', borderRadius: 999, paddingVertical: Spacing.two, paddingHorizontal: Spacing.three },
});
