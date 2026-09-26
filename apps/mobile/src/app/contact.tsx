import { router, Stack } from 'expo-router';
import { Linking } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ListRow, ListSection } from '@/components/ui/list';
import { Screen } from '@/components/ui/screen';
import { ErrorState, LoadingState } from '@/components/ui/states';
import { openSitePage, useConfig } from '@/hooks/use-config';

/** The website's /contact: support tickets, emails, legal contacts, company details. */
export default function ContactScreen() {
  const config = useConfig();

  return (
    <>
      <Stack.Screen options={{ title: 'Contact us' }} />
      <Screen refreshing={config.isRefetching} onRefresh={() => void config.refetch()}>
        {config.isPending ? (
          <LoadingState />
        ) : config.error ? (
          <ErrorState message={config.error.message} onRetry={() => void config.refetch()} />
        ) : (
          <>
            <ThemedText type="subtitle">Contact us</ThemedText>

            <ListSection title="Help with your account, a course or a payment">
              <ListRow
                label="Open a support ticket"
                subtitle="The fastest way to reach us — your whole conversation stays in one place."
                onPress={() => router.push('/support/new')}
              />
              <ListRow label="See your existing tickets" onPress={() => router.push('/support')} />
              <ListRow
                label="Email support"
                value={config.data.company.supportEmail}
                onPress={() => void Linking.openURL(`mailto:${config.data.company.supportEmail}`)}
                last
              />
            </ListSection>
            <ThemedText type="small" themeColor="textSecondary">
              Paid but can&apos;t see your course? Include your purchase reference from your purchase history on the
              website. Looking for a refund? See the{' '}
              <ThemedText
                type="small"
                style={{ textDecorationLine: 'underline' }}
                onPress={() => void openSitePage(config.data.siteUrl, '/refund-policy')}>
                Refund Policy
              </ThemedText>
              .
            </ThemedText>

            <ListSection title="Legal, privacy and copyright">
              <ListRow
                label="Legal, privacy and copyright requests"
                value={config.data.company.legalEmail}
                onPress={() => void Linking.openURL(`mailto:${config.data.company.legalEmail}`)}
              />
              <ListRow
                label="How to send a copyright notice"
                subtitle="DMCA & Takedown Policy"
                onPress={() => void openSitePage(config.data.siteUrl, '/dmca')}
              />
              <ListRow label="All our policies" onPress={() => router.push('/legal')} last />
            </ListSection>

            <ListSection title="Company">
              <ListRow label="Legal name" subtitle={config.data.company.legalName} />
              <ListRow label="Registered office" subtitle={config.data.company.registeredAddress} />
              <ListRow label="Company registration" subtitle={config.data.company.registration} />
              <ListRow label="PAN" subtitle={config.data.company.pan} last />
            </ListSection>
          </>
        )}
      </Screen>
    </>
  );
}
