/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

// Chiyali's palette, matching the website (apps/web/src/app/globals.css).
export const Colors = {
  light: {
    text: '#23232a',
    background: '#ffffff',
    backgroundElement: '#f4f4f5',
    backgroundSelected: '#e9e9ec',
    textSecondary: '#61616b',
    border: '#e4e4e7',
    primary: '#0055ff',
    onPrimary: '#ffffff',
    success: '#08875c',
    danger: '#dc2626',
  },
  dark: {
    text: '#eeeef0',
    background: '#111113',
    backgroundElement: '#1b1b1e',
    backgroundSelected: '#2b2b2f',
    textSecondary: '#a1a1aa',
    border: '#2b2b2f',
    primary: '#3380ff',
    onPrimary: '#ffffff',
    success: '#2fbf8a',
    danger: '#ef4444',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
