// Where to send someone after sign-in. Only a path on this site is allowed:
// "/courses?x=1" yes; "https://evil.example", "//evil.example",
// "/\evil.example", "javascript:..." no (open-redirect protection).
// Plain function, safe to use on the client, the server and in middleware.
const PLACEHOLDER_ORIGIN = "https://paperglidr.invalid";

export function safeRedirectPath(
  value: string | string[] | null | undefined,
  fallback = "/",
): string {
  if (typeof value !== "string") return fallback;
  if (!value.startsWith("/") || value.startsWith("//")) return fallback;
  // Browsers treat "\" like "/" ("/\evil.example" is protocol-relative), and
  // control characters are stripped before parsing — reject both outright.
  if (/[\\\u0000-\u001f\u007f]/.test(value)) return fallback;

  let url: URL;
  try {
    url = new URL(value, PLACEHOLDER_ORIGIN);
  } catch {
    return fallback;
  }
  if (url.origin !== PLACEHOLDER_ORIGIN) return fallback;
  // Don't bounce back into the sign-in flow itself.
  if (url.pathname === "/sign-in" || url.pathname === "/sign-up") return fallback;
  return `${url.pathname}${url.search}${url.hash}`;
}
