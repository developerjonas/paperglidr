import { openBrowserAsync } from 'expo-web-browser';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { NOT_GOVERNMENT_DISCLAIMER, OFFICIAL_SOURCES } from '@/constants/official-info';
import { useConfig } from '@/hooks/use-config';
import { useTheme } from '@/hooks/use-theme';

/** The server's disclaimer and sources, or the bundled copy until it loads. */
function useOfficialInfo() {
  const config = useConfig();
  return config.data?.officialInfo ?? { disclaimer: NOT_GOVERNMENT_DISCLAIMER, sources: OFFICIAL_SOURCES };
}

function SourceLink({ url }: { url: string }) {
  const theme = useTheme();
  return (
    <ThemedText type="small" style={{ color: theme.primary }} onPress={() => void openBrowserAsync(url)}>
      {url.replace(/^https:\/\//, '')}
    </ThemedText>
  );
}

/**
 * "Not a government app", and every official source. Shown on the Account
 * tab (About Chiyali) and the Terms and policies screen.
 */
export function NotGovernmentNotice() {
  const theme = useTheme();
  const info = useOfficialInfo();
  return (
    <View style={[styles.box, { borderColor: theme.border }]}>
      <ThemedText type="smallBold">Not a government app</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        {info.disclaimer}
      </ThemedText>
      <ThemedText type="smallBold" style={styles.sourcesTitle}>
        Official sources
      </ThemedText>
      {info.sources.map((source) => (
        <ThemedText key={source.url} type="small" themeColor="textSecondary">
          {source.exam}: {source.body}, <SourceLink url={source.url} />
        </ThemedText>
      ))}
    </View>
  );
}

/** On a government-exam topic in Browse: not the exam body, and its official source. */
export function OfficialSourceNote({ topicSlug }: { topicSlug: string }) {
  const theme = useTheme();
  const sources = useOfficialInfo().sources.filter((source) => source.topicSlug === topicSlug);
  if (sources.length === 0) return null;
  return (
    <View style={[styles.box, { borderColor: theme.border }]}>
      <ThemedText type="small" themeColor="textSecondary">
        Chiyali is not a government app and isn&apos;t affiliated with any exam body. For official notices,
        syllabuses, dates and results:{' '}
        {sources.map((source, i) => (
          <ThemedText key={source.url} type="small" themeColor="textSecondary">
            {i > 0 ? '; ' : ''}
            {source.body}, <SourceLink url={source.url} />
          </ThemedText>
        ))}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    gap: Spacing.one,
    padding: Spacing.three,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
  },
  sourcesTitle: { marginTop: Spacing.two },
});
