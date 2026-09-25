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

## Layout

- `src/app/` — every file is a screen (Expo Router). `(tabs)` holds the five
  tabs; everything else is pushed full-screen over them, and `(auth)` opens
  as a modal.
- `src/components/`, `src/hooks/`, `src/constants/` — shared code; nothing
  here is a route.

## Status

Step 2: every screen is still a placeholder; the typed API client is in
place and Home checks the connection. Payments and checkout are not in the app.
