import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { focusManager, QueryClient, QueryClientProvider, type Query } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import Constants from 'expo-constants';
import { useEffect, useState, type ReactNode } from 'react';
import { AppState, Platform } from 'react-native';

import { ApiError } from './client';

// The public catalogue (home rows, categories, search, course and
// instructor pages) is saved on the phone, so the app opens straight to
// courses (even offline) and refreshes them in the background. Nothing
// user-specific is saved: those queries live under `me` (see keys.ts) and
// stay in memory only, so signing out leaves nothing behind on the device.
const PERSISTED_ROOTS = new Set(['config', 'categories', 'products', 'search', 'product', 'course', 'instructor']);
const PERSIST_MAX_AGE = 24 * 60 * 60 * 1000;

function shouldPersist(query: Query) {
  return query.state.status === 'success' && PERSISTED_ROOTS.has(String(query.queryKey[0]));
}

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        // Kept at least as long as the saved copy, or restored data would be dropped at once.
        gcTime: PERSIST_MAX_AGE,
        // A 4xx won't change on retry; network blips and 5xx might.
        retry: (failureCount, error) =>
          !(error instanceof ApiError && error.status >= 400 && error.status < 500) && failureCount < 2,
      },
      mutations: { retry: false },
    },
  });
}

const persister =
  Platform.OS === 'web'
    ? null
    : createAsyncStoragePersister({ storage: AsyncStorage, key: 'chiyali.query-cache', throttleTime: 2000 });

/** TanStack Query for the whole app, refetching stale data when the app comes back to the foreground. */
export function ApiProvider({ children }: { children: ReactNode }) {
  const [client] = useState(createQueryClient);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    const subscription = AppState.addEventListener('change', (status) => {
      focusManager.setFocused(status === 'active');
    });
    return () => subscription.remove();
  }, []);

  if (persister == null) return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  return (
    <PersistQueryClientProvider
      client={client}
      persistOptions={{
        persister,
        maxAge: PERSIST_MAX_AGE,
        // A new app version starts with a fresh cache, in case the API's shapes changed.
        buster: Constants.expoConfig?.version ?? '',
        dehydrateOptions: { shouldDehydrateQuery: shouldPersist },
      }}>
      {children}
    </PersistQueryClientProvider>
  );
}
