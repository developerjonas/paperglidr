import { Link, type Href, Stack } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type PlaceholderLink = { label: string; href: Href };

/**
 * Step 1 stand-in for a screen: its name, what it will show and which v1
 * endpoint it will read, plus links to the screens it leads to — so the
 * whole navigation map can be walked before any real UI exists.
 */
export function PlaceholderScreen({
  title,
  description,
  api,
  links = [],
  headerShown = true,
  children,
}: {
  title: string;
  description: string;
  api?: string;
  links?: PlaceholderLink[];
  headerShown?: boolean;
  /** Extra content under the description, e.g. a live API check. */
  children?: ReactNode;
}) {
  const theme = useTheme();

  return (
    <ThemedView style={styles.fill}>
      <Stack.Screen options={{ title, headerShown }} />
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content}>
        <View style={styles.column}>
          <ThemedText type="smallBold" themeColor="textSecondary" style={styles.eyebrow}>
            PLACEHOLDER
          </ThemedText>
          <ThemedText type="subtitle">{title}</ThemedText>
          <ThemedText themeColor="textSecondary">{description}</ThemedText>
          {api ? (
            <ThemedView type="backgroundElement" style={styles.api}>
              <ThemedText type="code">{api}</ThemedText>
            </ThemedView>
          ) : null}
          {children}

          {links.length > 0 ? (
            <View style={styles.links}>
              {links.map((link) => (
                <Link key={link.label} href={link.href} asChild>
                  <Pressable
                    style={({ pressed }) => [
                      styles.link,
                      { borderColor: theme.border, opacity: pressed ? 0.6 : 1 },
                    ]}>
                    <ThemedText style={{ color: theme.primary }}>{link.label} →</ThemedText>
                  </Pressable>
                </Link>
              ))}
            </View>
          ) : null}
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: { padding: Spacing.four, paddingBottom: Spacing.six, alignItems: 'center' },
  column: { width: '100%', maxWidth: MaxContentWidth, gap: Spacing.two },
  eyebrow: { letterSpacing: 1 },
  api: { borderRadius: 10, padding: Spacing.three, marginTop: Spacing.two },
  links: { marginTop: Spacing.four, gap: Spacing.two },
  link: { borderWidth: 1, borderRadius: 14, paddingVertical: Spacing.three, paddingHorizontal: Spacing.three },
});
