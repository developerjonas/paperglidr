import { Pressable, StyleSheet, View } from 'react-native';
import type { ComponentProps } from 'react';

import type { Category } from '@/api/types';
import { ThemedText } from '@/components/themed-text';
import { Icon } from '@/components/ui/icon';
import { Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';

type IconName = Pick<ComponentProps<typeof Icon>, 'ios' | 'android'>;
type TopicStyle = IconName & { light: string; dark: string };

// The same look as the website's topic cards (features/categories/lib/categoryStyle.ts):
// an icon and a colour guessed from the slug, so a new category needs no app update.
const STYLES: { match: RegExp; style: TopicStyle }[] = [
  { match: /loksewa|psc|government|civil/, style: { ios: 'building.columns', android: 'account_balance', light: '#e11d48', dark: '#fb7185' } },
  { match: /entrance|exam|school|see|plus-two|neb|iom|ioe|cee/, style: { ios: 'graduationcap', android: 'school', light: '#d97706', dark: '#fbbf24' } },
  { match: /language|english|korean|japanese|ielts|topik|nepali/, style: { ios: 'character.bubble', android: 'translate', light: '#0284c7', dark: '#38bdf8' } },
  { match: /program|coding|code|tech|web|it\b|computer|developer/, style: { ios: 'chevron.left.forwardslash.chevron.right', android: 'code', light: '#4f46e5', dark: '#818cf8' } },
  { match: /account|finance|business|excel|tally|ca\b|market/, style: { ios: 'function', android: 'calculate', light: '#059669', dark: '#34d399' } },
  { match: /design|art|photo|video|creative/, style: { ios: 'paintpalette', android: 'palette', light: '#c026d3', dark: '#e879f9' } },
  { match: /digital|skill|office|freelanc/, style: { ios: 'laptopcomputer', android: 'laptop', light: '#0891b2', dark: '#22d3ee' } },
  { match: /academic|science|math|study/, style: { ios: 'books.vertical', android: 'local_library', light: '#ea580c', dark: '#fb923c' } },
];
const DEFAULT: TopicStyle = { ios: 'book', android: 'menu_book', light: '#0055ff', dark: '#3380ff' };

function topicStyle(slug: string) {
  const s = slug.toLowerCase();
  return STYLES.find(({ match }) => match.test(s))?.style ?? DEFAULT;
}

function useTopicColor(slug: string) {
  const dark = useColorScheme() === 'dark';
  const style = topicStyle(slug);
  const color = dark ? style.dark : style.light;
  // ~12% of the colour behind the icon.
  return { style, color, tint: `${color}1F` };
}

const courses = (n: number) => `${n} ${n === 1 ? 'course' : 'courses'}`;

/** A topic's icon on its coloured tile. */
export function TopicIcon({ slug, size = 48 }: { slug: string; size?: number }) {
  const { style, color, tint } = useTopicColor(slug);
  return (
    <View style={[styles.tile, { width: size, height: size, borderRadius: size * 0.28, backgroundColor: tint }]}>
      <Icon ios={style.ios} android={style.android} size={size * 0.5} color={color} />
    </View>
  );
}

/** "Explore by topic": a two-column grid of big topic cards. */
export function TopicCards({ categories, onSelect }: { categories: Category[]; onSelect: (categoryId: string) => void }) {
  return (
    <View style={styles.grid}>
      {categories.map((category) => (
        <TopicCard key={category.id} category={category} onPress={() => onSelect(category.id)} />
      ))}
    </View>
  );
}

function TopicCard({ category, onPress }: { category: Category; onPress: () => void }) {
  const theme = useTheme();
  const { color } = useTopicColor(category.slug);
  const count = category.courseCount;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${category.name}${count != null ? `, ${courses(count)}` : ''}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: theme.background, borderColor: pressed ? color : theme.border, opacity: pressed ? 0.85 : 1 },
      ]}>
      <TopicIcon slug={category.slug} />
      <View style={styles.cardText}>
        <ThemedText type="smallBold" numberOfLines={2}>
          {category.name}
        </ThemedText>
        {count != null ? (
          <ThemedText type="small" themeColor="textSecondary">
            {count > 0 ? courses(count) : 'Coming soon'}
          </ThemedText>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.three },
  card: {
    flexBasis: '46%',
    flexGrow: 1,
    gap: Spacing.three,
    borderWidth: 1,
    borderRadius: 18,
    padding: Spacing.three,
  },
  cardText: { gap: 2 },
  tile: { alignItems: 'center', justifyContent: 'center' },
});
