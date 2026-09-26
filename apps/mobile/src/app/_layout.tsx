import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { useColorScheme } from 'react-native';

import { ApiProvider } from '@/api/query-client';
import { AuthProvider } from '@/auth/auth-context';
import { Colors } from '@/constants/theme';

// Root navigator: the tab bar, with every detail screen pushed full-screen
// on top of it (so the tab bar hides there). Sign-in, sign-up and forgot
// password open as a modal. Auth is app-wide but optional (auth-context).
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
          <Stack screenOptions={{ headerBackButtonDisplayMode: 'minimal' }}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="(auth)/sign-in" options={{ presentation: 'modal', title: 'Sign in' }} />
            <Stack.Screen name="(auth)/sign-up" options={{ presentation: 'modal', title: 'Sign up' }} />
            <Stack.Screen
              name="(auth)/forgot-password"
              options={{ presentation: 'modal', title: 'Forgot password' }}
            />
            <Stack.Screen name="report" options={{ presentation: 'modal', title: 'Report' }} />
          </Stack>
        </ThemeProvider>
      </AuthProvider>
    </ApiProvider>
  );
}
