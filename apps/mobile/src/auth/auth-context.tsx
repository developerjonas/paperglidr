import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as SplashScreen from 'expo-splash-screen';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { setAuthTokenGetter, setUnauthorizedHandler } from '@/api/client';
import { keys } from '@/api/keys';
import type { Me } from '@/api/types';
import { api } from '@/api/v1';

import { authApi } from './auth-api';
import { tokenStore } from './token-store';

// Keep the splash up until the stored session is restored, so a signed-in
// user never sees a flash of the signed-out app.
void SplashScreen.preventAutoHideAsync();

export type AuthStatus = 'restoring' | 'signedIn' | 'signedOut';

type AuthContextValue = {
  status: AuthStatus;
  /** The signed-in user; undefined while loading (or offline at launch). */
  user: Me | undefined;
  signIn: (identifier: string, password: string) => Promise<void>;
  signUp: (input: { name: string; username: string; email: string; password: string }) => Promise<void>;
  signOut: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  isUsernameAvailable: (username: string) => Promise<boolean>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * The session for the whole app. Signing in is optional: public screens
 * work signed out, and signed-in-only screens show a sign-in prompt
 * (components/require-auth.tsx) instead of forcing a redirect.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [token, setToken] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(true);
  // The API client reads the token synchronously on every request.
  const tokenRef = useRef<string | null>(null);

  const applyToken = useCallback(
    (next: string | null) => {
      tokenRef.current = next;
      setToken(next);
      // Nothing of one user's may survive into the next session.
      queryClient.removeQueries({ queryKey: keys.me.all });
    },
    [queryClient],
  );

  const signOutLocally = useCallback(async () => {
    await tokenStore.clear().catch(() => {});
    applyToken(null);
  }, [applyToken]);

  useEffect(() => {
    setAuthTokenGetter(() => tokenRef.current);
    // A 401 while signed in means the session ended (expired, reset, or
    // signed out elsewhere): drop it rather than keep failing.
    setUnauthorizedHandler(() => {
      if (tokenRef.current != null) void signOutLocally();
    });
  }, [signOutLocally]);

  useEffect(() => {
    let cancelled = false;
    tokenStore
      .get()
      .catch(() => null)
      .then((stored) => {
        if (cancelled) return;
        tokenRef.current = stored;
        setToken(stored);
        setRestoring(false);
        void SplashScreen.hideAsync();
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const me = useQuery({ queryKey: keys.me.profile, queryFn: api.me, enabled: token != null });

  const startSession = useCallback(
    async (newToken: string) => {
      await tokenStore.set(newToken);
      applyToken(newToken);
      await queryClient.fetchQuery({ queryKey: keys.me.profile, queryFn: api.me }).catch(() => {});
    },
    [applyToken, queryClient],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      status: restoring ? 'restoring' : token != null ? 'signedIn' : 'signedOut',
      user: token != null ? me.data : undefined,
      signIn: async (identifier, password) => startSession(await authApi.signIn(identifier, password)),
      signUp: async (input) => startSession(await authApi.signUp(input)),
      signOut: async () => {
        const current = tokenRef.current;
        // End the session on the server too; sign out locally regardless.
        if (current) await authApi.signOut(current).catch(() => {});
        await signOutLocally();
      },
      requestPasswordReset: authApi.requestPasswordReset,
      isUsernameAvailable: authApi.isUsernameAvailable,
    }),
    [restoring, token, me.data, startSession, signOutLocally],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (value == null) throw new Error('useAuth must be used inside <AuthProvider>');
  return value;
}
