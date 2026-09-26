import { Alert, Platform } from 'react-native';

/** Ask before signing out (web: no native dialog, just do it). */
export function confirmSignOut(signOut: () => Promise<void>) {
  if (Platform.OS === 'web') {
    void signOut();
    return;
  }
  Alert.alert('Sign out?', 'You can keep browsing courses signed out.', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Sign out', style: 'destructive', onPress: () => void signOut() },
  ]);
}
