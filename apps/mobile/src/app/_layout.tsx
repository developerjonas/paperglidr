import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { useColorScheme } from 'react-native';

import { ApiProvider } from '@/api/query-client';
import { Colors } from '@/constants/theme';

// Root navigator: the tab bar, with every detail screen pushed full-screen
// on top of it (so the tab bar hides there). Sign-in/up open as a modal.
export default function RootLayout() {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
  const colors = Colors[scheme];

  return (
    <ApiProvider>
      <ThemeProvider
        value={{
          ...base,
          colors: {
            ...base.colors,
            primary: colors.primary,
            background: colors.background,
            card: colors.background,
            text: colors.text,
            border: colors.border,
          },
        }}>
        <Stack screenOptions={{ headerBackButtonDisplayMode: 'minimal' }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false, presentation: 'modal' }} />
        </Stack>
      </ThemeProvider>
    </ApiProvider>
  );
}
