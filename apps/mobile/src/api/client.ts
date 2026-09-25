import { API_URL } from './config';

/** Any non-2xx answer. `message` is the server's `{ message }` — safe to show. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }

  /** No response at all (offline, server down, timeout). */
  get isNetworkError() {
    return this.status === 0;
  }
}

// Step 3 (auth) plugs the stored session token in here.
let getAuthToken: () => string | null = () => null;
export function setAuthTokenGetter(getter: () => string | null) {
  getAuthToken = getter;
}

// Called on any 401 so auth can sign the user out locally.
let onUnauthorized: () => void = () => {};
export function setUnauthorizedHandler(handler: () => void) {
  onUnauthorized = handler;
}

const TIMEOUT_MS = 15_000;

type Method = 'GET' | 'POST' | 'PUT' | 'DELETE';

/**
 * Every request to the web app goes through here: JSON in and out, the
 * Bearer token when signed in, no cookies (see docs/MOBILE_API.md), a
 * timeout, and errors as ApiError.
 */
export async function apiFetch<T>(
  path: string,
  { method = 'GET', body, signal }: { method?: Method; body?: unknown; signal?: AbortSignal } = {},
): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const token = getAuthToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const timeout = new AbortController();
  const timer = setTimeout(() => timeout.abort(), TIMEOUT_MS);
  signal?.addEventListener('abort', () => timeout.abort());

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      credentials: 'omit',
      signal: timeout.signal,
    });
  } catch {
    throw new ApiError(
      0,
      signal?.aborted ? 'Request cancelled.' : "Can't reach Chiyali. Check your connection and try again.",
    );
  } finally {
    clearTimeout(timer);
  }

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    if (response.status === 401) onUnauthorized();
    const message =
      (data && typeof data.message === 'string' && data.message) ||
      (response.status === 404 ? 'Not found.' : 'Something went wrong. Please try again.');
    throw new ApiError(response.status, message);
  }
  return data as T;
}

/** Query-string helper that drops empty values. */
export function query(params: Record<string, string | number | undefined | null>) {
  const entries = Object.entries(params).filter(
    (entry): entry is [string, string | number] => entry[1] != null && entry[1] !== '',
  );
  if (entries.length === 0) return '';
  return `?${entries.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`).join('&')}`;
}
