import { Stack } from 'expo-router';
import { Linking } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ListRow, ListSection } from '@/components/ui/list';
import { Screen } from '@/components/ui/screen';
import { ErrorState, LoadingState } from '@/components/ui/states';
import { openSitePage, useConfig } from '@/hooks/use-config';
import { useTheme } from '@/hooks/use-theme';

/**
 * The website's /legal index. Each policy opens on the website, which holds
 * the only copy of the legal text (so the app can never show an old one).
 */
export default function LegalScreen() {
  const theme = useTheme();
  const config = useConfig();

  return (
    <>
      <Stack.Screen options={{ title: 'Terms and policies' }} />
      <Screen refreshing={config.isRefetching} onRefresh={() => void config.refetch()}>
        {config.isPending ? (
          <LoadingState />
        ) : config.error ? (
          <ErrorState message={config.error.message} onRetry={() => void config.refetch()} />
        ) : (
          <>
            <ThemedText type="subtitle">Legal</ThemedText>
            <ThemedText themeColor="textSecondary">
              The terms and policies that apply when you use {config.data.company.brandName}. Last updated{' '}
              {config.data.legal.lastUpdated}.
            </ThemedText>
            <ListSection title="Policies">
              {config.data.legal.pages.map((page, index) => (
                <ListRow
                  key={page.path}
                  label={page.title}
                  subtitle={page.summary}
                  last={index === config.data.legal.pages.length - 1}
                  onPress={() => void openSitePage(config.data.siteUrl, page.path)}
                />
              ))}
            </ListSection>
            <ThemedText type="small" themeColor="textSecondary">
              Questions about any of them:{' '}
              <ThemedText
                type="small"
                style={{ color: theme.primary }}
                onPress={() => void Linking.openURL(`mailto:${config.data.company.legalEmail}`)}>
                {config.data.company.legalEmail}
              </ThemedText>
            </ThemedText>
          </>
        )}
      </Screen>
    </>
  );
}
