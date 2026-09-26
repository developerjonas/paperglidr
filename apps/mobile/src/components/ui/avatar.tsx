import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';

function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]!.toUpperCase())
      .join('') || '?'
  );
}

/** Profile photo, or initials when there isn't one. */
export function Avatar({ name, image, size = 48 }: { name: string; image?: string | null; size?: number }) {
  const theme = useTheme();
  const shape = { width: size, height: size, borderRadius: size / 2 };

  if (image) {
    return (
      <Image
        source={image}
        style={[shape, { backgroundColor: theme.backgroundSelected }]}
        contentFit="cover"
        accessibilityLabel={`${name}'s photo`}
      />
    );
  }
  return (
    <View style={[styles.fallback, shape, { backgroundColor: theme.primary }]} accessibilityLabel={name}>
      <ThemedText style={{ color: theme.onPrimary, fontSize: size * 0.38, lineHeight: size * 0.5, fontWeight: '700' }}>
        {initials(name)}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: { alignItems: 'center', justifyContent: 'center' },
});
