import { focusManager, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState, type ReactNode } from 'react';
import { AppState, Platform } from 'react-native';

import { ApiError } from './client';

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        // A 4xx won't change on retry; network blips and 5xx might.
        retry: (failureCount, error) =>
          !(error instanceof ApiError && error.status >= 400 && error.status < 500) && failureCount < 2,
      },
      mutations: { retry: false },
    },
  });
}

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

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
