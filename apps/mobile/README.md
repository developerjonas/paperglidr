# Chiyali mobile

The Chiyali app for iOS and Android (Expo, Expo Router), built on the web
app's v1 API. API reference: [docs/MOBILE_API.md](../../docs/MOBILE_API.md).

## Run it

From the repo root, install once: `pnpm install`. Then, from `apps/mobile`:

```bash
pnpm start          # Expo dev server — open in Expo Go or a simulator
pnpm ios            # iOS simulator
pnpm android        # Android emulator
pnpm check-types    # TypeScript
pnpm lint           # ESLint
```

## Connecting to the API

The app talks to the web app's `/api/v1` ([src/api](src/api)).

- **Development:** run the web app too (`pnpm dev` in `apps/web`, port 3000)
  with `MOBILE_API_ENABLED=true` in `apps/web/.env.local`. The app finds it at
  your computer's LAN address automatically, so a phone on the same Wi-Fi
  works. Home shows an "API connection" card while this is being built.
- **Anything else:** set `EXPO_PUBLIC_API_URL` (see `.env.example`).
- **Release builds:** `https://chiyali.com`.

In code: call `api.*` from [src/api/v1.ts](src/api/v1.ts) through TanStack
Query with the keys in [src/api/keys.ts](src/api/keys.ts). Errors are
`ApiError` with the server's message, safe to show.

## Signing in

Optional everywhere: browsing works signed out. [src/auth](src/auth) holds
the session — the token in the Keychain/Keystore (expo-secure-store),
restored at launch, sent as `Authorization: Bearer`, dropped on a 401.
Screens that need an account wrap themselves in `RequireAuth`, which shows
a sign-in prompt instead of redirecting. Email-or-username sign-in,
sign-up (same password rules as the website, from `@repo/password-policy`)
and forgot password; the reset itself happens on the website.

## Layout

- `src/app/` — every file is a screen (Expo Router). `(tabs)` holds the five
  tabs; everything else is pushed full-screen over them, and `(auth)` opens
  as a modal.
- `src/components/`, `src/hooks/`, `src/constants/` — shared code; nothing
  here is a route.

## Status

Step 6: sign-in and the account pages, product browsing, and learning —
My learning, the course player (progress, continue, outline, reviews),
public course pages, lessons (video / embed / PDF, mark complete with
certificates, previous / next, attachments, report) and lesson Q&A — work;
the rest are still placeholders. Google sign-in needs a development build (native module) and
comes later. Payments and checkout are not in the app.
