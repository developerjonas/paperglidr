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

## Layout

- `src/app/` — every file is a screen (Expo Router). `(tabs)` holds the five
  tabs; everything else is pushed full-screen over them, and `(auth)` opens
  as a modal.
- `src/components/`, `src/hooks/`, `src/constants/` — shared code; nothing
  here is a route.

## Status

Step 1: every screen exists as a placeholder showing its name, what it will
show and the API it will use. Payments and checkout are not in the app.
