import { Tabs, TabList, TabTrigger, TabSlot, type TabTriggerSlotProps } from 'expo-router/ui';
import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

import { Spacing } from '@/constants/theme';

// Native tabs aren't available on web: a simple bottom bar with the same five tabs.
export default function AppTabs() {
  return (
    <Tabs>
      <TabSlot style={{ flex: 1 }} />
      <TabList asChild>
        <ThemedView type="backgroundElement" style={styles.bar}>
          <TabTrigger name="index" href="/" asChild>
            <TabButton>Home</TabButton>
          </TabTrigger>
          <TabTrigger name="browse" href="/browse" asChild>
            <TabButton>Browse</TabButton>
          </TabTrigger>
          <TabTrigger name="learning" href="/learning" asChild>
            <TabButton>Learning</TabButton>
          </TabTrigger>
          <TabTrigger name="wishlist" href="/wishlist" asChild>
            <TabButton>Wishlist</TabButton>
          </TabTrigger>
          <TabTrigger name="account" href="/account" asChild>
            <TabButton>Account</TabButton>
          </TabTrigger>
        </ThemedView>
      </TabList>
    </Tabs>
  );
}

function TabButton({ children, isFocused, ...props }: TabTriggerSlotProps) {
  return (
    <Pressable {...props} style={styles.button}>
      <ThemedText type={isFocused ? 'smallBold' : 'small'} themeColor={isFocused ? 'primary' : 'textSecondary'}>
        {children}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: Spacing.two },
  button: { flex: 1, alignItems: 'center', paddingVertical: Spacing.two },
});
