import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// The Better Auth session token, in the Keychain (iOS) / Keystore (Android).
const KEY = 'chiyali.session-token';
const options: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
};

// SecureStore doesn't exist on web (a dev preview only): keep it in memory there.
let webToken: string | null = null;

export const tokenStore = {
  async get() {
    if (Platform.OS === 'web') return webToken;
    return SecureStore.getItemAsync(KEY, options);
  },
  async set(token: string) {
    if (Platform.OS === 'web') {
      webToken = token;
      return;
    }
    await SecureStore.setItemAsync(KEY, token, options);
  },
  async clear() {
    if (Platform.OS === 'web') {
      webToken = null;
      return;
    }
    await SecureStore.deleteItemAsync(KEY, options);
  },
};
