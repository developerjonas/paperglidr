import { ApiError } from '@/api/client';
import { API_URL } from '@/api/config';

/**
 * Calls to Better Auth (/api/auth/*) — see docs/MOBILE_API.md "Signing in".
 * No cookies, an `Origin: chiyali://` header, and the session token comes
 * back in the `set-auth-token` header (the server's bearer plugin).
 */
async function authFetch(path: string, body: unknown, token?: string | null) {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    Origin: 'chiyali://',
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  let response: Response;
  try {
    response = await fetch(`${API_URL}/api/auth${path}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      credentials: 'omit',
    });
  } catch {
    throw new ApiError(0, "Can't reach Chiyali. Check your connection and try again.");
  }
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new ApiError(response.status, authErrorMessage(response.status, data));
  }
  return { data, token: response.headers.get('set-auth-token') };
}

function authErrorMessage(status: number, data: { message?: string; code?: string } | null) {
  if (status === 429) return 'Too many attempts. Wait a minute and try again.';
  switch (data?.code) {
    case 'INVALID_EMAIL_OR_PASSWORD':
    case 'INVALID_USERNAME_OR_PASSWORD':
      return "That email/username and password don't match.";
    case 'USER_ALREADY_EXISTS':
    case 'USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL':
      return 'An account with this email already exists. Sign in instead.';
    case 'USERNAME_IS_ALREADY_TAKEN':
      return 'That username is taken.';
  }
  return data?.message || 'Something went wrong. Please try again.';
}

function requireToken(token: string | null) {
  if (!token) throw new ApiError(500, 'Signed in, but no session was returned. Please try again.');
  return token;
}

export const authApi = {
  /** Email if it has an @, otherwise username. Returns the session token. */
  async signIn(identifier: string, password: string) {
    const id = identifier.trim();
    const { token } = id.includes('@')
      ? await authFetch('/sign-in/email', { email: id, password })
      : await authFetch('/sign-in/username', { username: id, password });
    return requireToken(token);
  },

  async signUp(input: { name: string; username: string; email: string; password: string }) {
    const { token } = await authFetch('/sign-up/email', {
      name: input.name.trim(),
      username: input.username,
      displayUsername: input.username,
      email: input.email.trim(),
      password: input.password,
    });
    return requireToken(token);
  },

  async isUsernameAvailable(username: string) {
    const { data } = await authFetch('/is-username-available', { username });
    return Boolean((data as { available?: boolean } | null)?.available);
  },

  /** Always "succeeds" — the server doesn't say whether the email has an account. */
  async requestPasswordReset(email: string) {
    await authFetch('/request-password-reset', { email: email.trim(), redirectTo: '/reset-password' });
  },

  async signOut(token: string) {
    await authFetch('/sign-out', {}, token);
  },
};
