# @repo/brand

The single source of Chiyali's logo and colours, for the website and the app.

- `fonts/`: Inter (Regular, Bold, Bold Italic; SIL Open Font License, `fonts/OFL.txt`), used by the web app's link-preview images (`apps/web/src/lib/og.tsx`).
- `src/index.ts`: the paper-plane mark (`PLANE_MARK`), the wordmark (`WORDMARK`), `BRAND_COLORS`, and `planeSvg()` to draw the mark as an SVG.
- **Logos in the apps** draw from it: `apps/web/src/components/Logo.tsx` and `apps/mobile/src/components/logo.tsx`.
- **Icons and splash images** are generated from it. After changing the mark or a colour, run:

  ```
  pnpm --filter @repo/brand generate
  ```

  It writes (commit the results):

  | File | Used for |
  |---|---|
  | `apps/web/src/app/favicon.ico`, `icon.svg` | browser tab icon |
  | `apps/web/src/app/apple-icon.png` | iPhone/iPad home-screen icon |
  | `apps/mobile/assets/images/icon.png` | iOS app icon and store listing (1024, opaque) |
  | `apps/mobile/assets/images/android-icon-foreground.png`, `android-icon-monochrome.png` | Android adaptive icon and themed (Android 13+) icon |
  | `apps/mobile/assets/images/splash-icon.png`, `splash-icon-dark.png` | splash screen, light and dark |
  | `apps/mobile/assets/images/favicon.png` | the app's web build |
  | `apps/mobile/app.json` | splash and adaptive-icon background colours |

The splash screen only shows its real look in a preview or production build, not in Expo Go or a development build (see Expo's splash-screen guide).
