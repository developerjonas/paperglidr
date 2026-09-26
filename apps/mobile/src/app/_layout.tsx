import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { useColorScheme } from 'react-native';

import { ApiProvider } from '@/api/query-client';
import { AuthProvider } from '@/auth/auth-context';
import { Colors } from '@/constants/theme';

// Root navigator: the tab bar, with every detail screen pushed full-screen
// on top of it (so the tab bar hides there). Sign-in, sign-up and forgot
// password open as a modal. Auth is app-wide but optional (auth-context).
// The app is portrait, except a lesson, which turns to landscape for the
// video (app.json allows every orientation; each screen narrows it).
export default function RootLayout() {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
  const colors = Colors[scheme];

  return (
    <ApiProvider>
      <AuthProvider>
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
          <Stack screenOptions={{ headerBackButtonDisplayMode: 'minimal', orientation: 'portrait' }}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="lessons/[lessonId]/index" options={{ orientation: 'all' }} />
            <Stack.Screen name="(auth)/sign-in" options={{ presentation: 'modal', title: 'Sign in' }} />
            <Stack.Screen name="(auth)/sign-up" options={{ presentation: 'modal', title: 'Sign up' }} />
            <Stack.Screen
              name="(auth)/forgot-password"
              options={{ presentation: 'modal', title: 'Forgot password' }}
            />
            <Stack.Screen name="report" options={{ presentation: 'modal', title: 'Report' }} />
            <Stack.Screen name="review" options={{ presentation: 'modal', title: 'Review' }} />
          </Stack>
        </ThemeProvider>
      </AuthProvider>
    </ApiProvider>
  );
}
